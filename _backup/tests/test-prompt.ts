/**
 * Order Sync Agent - LLM Prompt Test Runner
 * 
 * Tests the conversation analysis prompt against various scenarios.
 * Run with: npx tsx tests/test-prompt.ts
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Types
interface Message {
    role: 'buyer' | 'seller';
    text: string;
    timestamp: string;
}

interface ProductVariant {
    id: string;
    title: string;
    price: string;
    option1?: string;
    option2?: string;
    option3?: string;
}

interface Product {
    id: string;
    title: string;
    variants: ProductVariant[];
}

interface AnalysisResult {
    intent_detected: boolean;
    confidence: number;
    product_id: string | null;
    variant_id: string | null;
    product_title?: string | null;
    variant_title?: string | null;
    quantity: number;
    total_value: number | null;
    trigger_message?: string | null;
    reasoning: string;
}

interface TestCase {
    id: string;
    name: string;
    conversation: Message[];
    catalog: Product[];
    expected: Partial<AnalysisResult>;
}

interface TestSuite {
    test_cases: TestCase[];
}

// Import prompt builder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptsPath = path.join(__dirname, '..', 'supabase', 'functions', '_shared', 'prompts.ts');

// Read and eval the prompts module (simplified for Node.js)
const promptsContent = fs.readFileSync(promptsPath, 'utf-8');

// Extract the SYSTEM_PROMPT from the file
const systemPromptMatch = promptsContent.match(/export const SYSTEM_PROMPT = `([\s\S]*?)`;/);
const SYSTEM_PROMPT = systemPromptMatch ? systemPromptMatch[1] : '';

function formatConversationForLLM(messages: Message[]): string {
    return messages
        .map(msg => `${msg.role.toUpperCase()}: ${msg.text}`)
        .join('\n');
}

function formatCatalogForLLM(products: Product[]): string {
    return JSON.stringify(products, null, 2);
}

function buildAnalysisPrompt(messages: Message[], catalog: Product[]): string {
    const conversationText = formatConversationForLLM(messages);
    const catalogText = formatCatalogForLLM(catalog);

    return SYSTEM_PROMPT
        .replace('{{MESSAGES}}', conversationText)
        .replace('{{SHOPIFY_PRODUCTS}}', catalogText);
}

// Initialize OpenAI client (works with any OpenAI-compatible API)
const openai = new OpenAI({
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || 'your-api-key',
    baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.LLM_MODEL || 'gpt-4o';

/**
 * Call LLM and parse response
 */
async function analyzeConversation(messages: Message[], catalog: Product[]): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt(messages, catalog);

    const response = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content || '';

    // Clean up response
    let cleanedText = content.trim();
    if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleanedText);
}

/**
 * Compare actual result to expected
 */
function validateResult(actual: AnalysisResult, expected: Partial<AnalysisResult>): { passed: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check intent_detected
    if (expected.intent_detected !== undefined && actual.intent_detected !== expected.intent_detected) {
        errors.push(`intent_detected: expected ${expected.intent_detected}, got ${actual.intent_detected}`);
    }

    // Check confidence (allow 0.15 tolerance)
    if (expected.confidence !== undefined) {
        const diff = Math.abs(actual.confidence - expected.confidence);
        if (diff > 0.15) {
            errors.push(`confidence: expected ~${expected.confidence}, got ${actual.confidence} (diff: ${diff.toFixed(2)})`);
        }
    }

    // Check product_id
    if (expected.product_id !== undefined && actual.product_id !== expected.product_id) {
        errors.push(`product_id: expected ${expected.product_id}, got ${actual.product_id}`);
    }

    // Check variant_id
    if (expected.variant_id !== undefined && actual.variant_id !== expected.variant_id) {
        errors.push(`variant_id: expected ${expected.variant_id}, got ${actual.variant_id}`);
    }

    // Check quantity
    if (expected.quantity !== undefined && actual.quantity !== expected.quantity) {
        errors.push(`quantity: expected ${expected.quantity}, got ${actual.quantity}`);
    }

    // Check total_value (allow 0.01 tolerance for floating point)
    if (expected.total_value !== undefined && expected.total_value !== null) {
        if (actual.total_value === null) {
            errors.push(`total_value: expected ${expected.total_value}, got null`);
        } else {
            const diff = Math.abs(actual.total_value - expected.total_value);
            if (diff > 0.01) {
                errors.push(`total_value: expected ${expected.total_value}, got ${actual.total_value}`);
            }
        }
    }

    return { passed: errors.length === 0, errors };
}

/**
 * Run a single test case
 */
async function runTestCase(testCase: TestCase): Promise<{ passed: boolean; result?: AnalysisResult; errors?: string[]; error?: string }> {
    try {
        const result = await analyzeConversation(testCase.conversation, testCase.catalog);
        const validation = validateResult(result, testCase.expected);

        return {
            passed: validation.passed,
            result,
            errors: validation.errors,
        };
    } catch (error) {
        return {
            passed: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Main test runner
 */
async function runAllTests() {
    console.log('🧪 Order Sync Agent - LLM Prompt Test Suite\n');
    console.log(`Using model: ${MODEL}`);
    console.log(`API base URL: ${process.env.LLM_BASE_URL || 'https://api.openai.com/v1'}\n`);

    // Load test cases
    const testDataPath = path.join(__dirname, 'test-conversations.json');
    const testData: TestSuite = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));

    let passed = 0;
    let failed = 0;

    for (const testCase of testData.test_cases) {
        process.stdout.write(`Testing ${testCase.id}: ${testCase.name}... `);

        const result = await runTestCase(testCase);

        if (result.passed) {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL');
            failed++;

            if (result.error) {
                console.log(`   Error: ${result.error}`);
            } else if (result.errors) {
                result.errors.forEach(err => console.log(`   - ${err}`));
            }

            if (result.result) {
                console.log(`   Actual: ${JSON.stringify({
                    intent_detected: result.result.intent_detected,
                    confidence: result.result.confidence,
                    product_id: result.result.product_id,
                    variant_id: result.result.variant_id,
                    quantity: result.result.quantity,
                    total_value: result.result.total_value,
                })}`);
                console.log(`   Reasoning: ${result.result.reasoning}`);
            }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Results: ${passed}/${passed + failed} passed`);
    console.log(`Accuracy: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (passed / (passed + failed) >= 0.9) {
        console.log('🎉 Target accuracy (90%+) achieved!');
    } else {
        console.log('⚠️  Below target accuracy (90%)');
    }
}

// Run tests
runAllTests().catch(console.error);
