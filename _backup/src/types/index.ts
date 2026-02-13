// Shared types for Order Sync Agent UI

export interface Message {
  role: 'buyer' | 'seller';
  text: string;
  timestamp: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface Product {
  id: string;
  title: string;
  variants: ProductVariant[];
}

export interface AnalysisRequest {
  messages: Message[];
  shopify_products: Product[];
}

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

export interface TestCase {
  id: string;
  name: string;
  conversation: Message[];
  catalog: Product[];
  expected: Partial<AnalysisResult>;
}

export interface TestSuite {
  test_cases: TestCase[];
}

export interface TestRunResult {
  testCase: TestCase;
  result: AnalysisResult;
  passed: boolean;
  timestamp: string;
}

export interface Conversation {
  id: string;
  buyerName: string;
  buyerAvatar?: string;
  messages: Message[];
  status: 'active' | 'pending' | 'completed';
  lastActivity: string;
  detectedIntent?: AnalysisResult;
}

export type ViewMode = 'conversations' | 'catalog' | 'analytics' | 'tests';
