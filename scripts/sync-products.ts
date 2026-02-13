
// scripts/sync-products.ts
// Antigravity Product Sync: Shopify -> Supabase + Vector Embeddings

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// Load environment variables
const env = config({ safe: true });
const supabaseUrl = env.SUPABASE_URL || Deno.env.get("SUPABASE_URL");
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const shopifyShop = env.SHOPIFY_SHOP_DOMAIN || Deno.env.get("SHOPIFY_SHOP_DOMAIN");
const shopifyToken = env.SHOPIFY_ACCESS_TOKEN || Deno.env.get("SHOPIFY_ACCESS_TOKEN"); // Access token for Admin API
// Alternatively use API Key + Password for private apps if token not available
const shopifyApiKey = env.SHOPIFY_API_KEY || Deno.env.get("SHOPIFY_API_KEY");
const shopifyApiSecret = env.SHOPIFY_API_SECRET || Deno.env.get("SHOPIFY_API_SECRET");

// OpenAI Configuration for Embeddings
const llmApiKey = env.LLM_API_KEY || Deno.env.get("LLM_API_KEY") || env.OPENAI_API_KEY || Deno.env.get("OPENAI_API_KEY");
const llmBaseUrl = env.LLM_BASE_URL || Deno.env.get("LLM_BASE_URL") || "https://api.openai.com/v1";

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    Deno.exit(1);
}

if (!llmApiKey) {
    console.error("❌ Missing LLM_API_KEY or OPENAI_API_KEY for embeddings");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Fetch Products from Shopify
async function fetchShopifyProducts() {
    console.log(`📦 Fetching products from ${shopifyShop}...`);

    // Construct URL - using Admin API
    // Note: For private apps, use https://{apikey}:{password}@{shop}.myshopify.com/admin/api/2023-10/products.json
    // For now, assuming we have an access token or just mocking the fetch if credentials aren't fully set up for this demo script

    if (!shopifyShop) {
        console.log("⚠️ SHOPIFY_SHOP_DOMAIN not set. Returning mock products for testing.");
        return [
            {
                id: "1234567890",
                title: "Antigravity Hoodie",
                body_html: "Premium cotton hoodie for coding in zero G.",
                product_type: "Apparel",
                vendor: "Antigravity Store",
                tags: "hoodie, black, comfort",
                variants: [{ id: "12345678901", title: "L", price: "49.00" }],
                images: [{ src: "https://via.placeholder.com/150" }]
            }
        ];
    }

    const url = `https://${shopifyShop}/admin/api/2023-10/products.json`;
    const headers = new Headers();

    if (shopifyToken) {
        headers.append("X-Shopify-Access-Token", shopifyToken);
    } else if (shopifyApiKey && shopifyApiSecret) {
        headers.append("Authorization", "Basic " + btoa(shopifyApiKey + ":" + shopifyApiSecret));
    }

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`Shopify API Error: ${response.statusText}`);
        const data = await response.json();
        return data.products;
    } catch (error) {
        console.error("❌ Failed to fetch Shopify products:", error);
        return [];
    }
}

// 2. Generate Embedding
async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await fetch(`${llmBaseUrl}/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${llmApiKey}`
            },
            body: JSON.stringify({
                model: "text-embedding-3-small",
                input: text
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Embedding API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    } catch (error) {
        console.error("❌ Embedding generation failed:", error);
        return [];
    }
}

// 3. Main Sync Function
async function sync() {
    console.log("🚀 Starting Antigravity Product Sync...");

    // Get seller ID (assuming single seller for this script, or fetch based on domain)
    // For demo, we'll try to find the first seller or create a default one
    let { data: seller } = await supabase.from('sellers').select('id, shopify_domain').limit(1).single();

    if (!seller) {
        console.log("ℹ️ No seller found, creating default...");
        const { data: newSeller, error } = await supabase.from('sellers').insert({
            shopify_domain: shopifyShop || 'demo-store.myshopify.com',
            email: 'admin@demo.com',
            business_name: 'Antigravity Demo Store'
        }).select().single();

        if (error) {
            console.error("❌ Failed to create seller:", error);
            Deno.exit(1);
        }
        seller = newSeller;
    }

    console.log(`👤 Syncing for Seller: ${seller.id} (${seller.shopify_domain})`);

    const products = await fetchShopifyProducts();
    console.log(`Found ${products.length} products.`);

    for (const p of products) {
        const searchText = `${p.title} ${p.body_html || ''} ${p.product_type} ${p.tags}`.trim();
        console.log(`🔹 Processing: ${p.title}`);

        // Generate embedding
        const embedding = await generateEmbedding(searchText);

        if (embedding.length === 0) {
            console.warn(`⚠️ Skipping ${p.title} due to embedding failure.`);
            continue;
        }

        // Upsert to Supabase
        const { error } = await supabase.from('products').upsert({
            id: p.id.toString(),
            seller_id: seller.id,
            title: p.title,
            description: p.body_html,
            product_type: p.product_type,
            tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()) : [],
            vendor: p.vendor,
            price: p.variants[0]?.price,
            compare_at_price: p.variants[0]?.compare_at_price,
            image_url: p.images[0]?.src,
            variants: p.variants,
            embedding: embedding,
            last_synced_at: new Date().toISOString()
        });

        if (error) {
            console.error(`❌ Failed to upsert ${p.title}:`, error);
        } else {
            console.log(`✅ Synced: ${p.title}`);
        }
    }

    console.log("🎉 Sync Complete!");
}

sync();
