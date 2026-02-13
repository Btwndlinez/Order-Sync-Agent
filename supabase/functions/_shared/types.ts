export interface Message {
  role?: 'buyer' | 'seller';
  isSeller?: boolean;
  text: string;
  timestamp: string | number;
}

// Shopify product variant
export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

// Shopify product
export interface Product {
  id: string;
  title: string;
  variants: ProductVariant[];
}

// Analysis request payload (Antigravity Matcher Edition)
export interface AnalysisRequest {
  messages: Message[];
  shopify_products?: Product[]; // Optional: will query from DB if not provided
  seller_id: string; // Required: for database product matching
  messenger_id?: string; // Optional: conversation identifier
}

// LLM analysis result
export interface AnalysisResult {
  intent_detected: boolean;
  confidence: number;
  product_id: string | null;
  variant_id: string | null;
  product_title: string | null;
  variant_title: string | null;
  quantity: number;
  total_value: number | null;
  trigger_message: string | null;
  reasoning: string;
}

// Test case structure
export interface TestCase {
  id: string;
  name: string;
  conversation: Message[];
  catalog: Product[];
  expected: Partial<AnalysisResult>;
}

// Test suite
export interface TestSuite {
  test_cases: TestCase[];
}
