import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

export type ActivityAction = 'push_to_chat' | 'link_copied' | 'category_selected' | 'product_matched' | 'manual_match';

export interface LogActivityParams {
  sellerId: string;
  action: ActivityAction;
  productId?: string;
  productName?: string;
  messagePreview?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  sellerId,
  action,
  productId,
  productName,
  messagePreview,
  metadata = {}
}: LogActivityParams): Promise<string | null> {
  if (!supabase) {
    console.warn('[Activity] Supabase not configured, skipping log');
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('log_activity', {
      p_seller_id: sellerId,
      p_action: action,
      p_product_id: productId || null,
      p_product_name: productName || null,
      p_message_preview: messagePreview || null,
      p_metadata: metadata
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[Activity] Failed to log activity:', err);
    return null;
  }
}

export async function logPushToChat(params: Omit<LogActivityParams, 'action'>): Promise<string | null> {
  return logActivity({ ...params, action: 'push_to_chat' });
}
