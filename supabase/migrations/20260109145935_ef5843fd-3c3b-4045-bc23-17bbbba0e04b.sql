-- Create table for tracking sent messages
CREATE TABLE public.connectix_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  customer_name TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('viber', 'sms')),
  template_id TEXT,
  template_name TEXT,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  trigger_type TEXT,
  trigger_status TEXT,
  is_sandbox BOOLEAN DEFAULT false,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_connectix_messages_order_id ON public.connectix_messages(order_id);
CREATE INDEX idx_connectix_messages_sent_at ON public.connectix_messages(sent_at DESC);
CREATE INDEX idx_connectix_messages_status ON public.connectix_messages(status);

-- Enable RLS
ALTER TABLE public.connectix_messages ENABLE ROW LEVEL SECURITY;

-- Create policies - all authenticated users can view messages
CREATE POLICY "Authenticated users can view messages"
  ON public.connectix_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert messages
CREATE POLICY "Authenticated users can insert messages"
  ON public.connectix_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role has full access"
  ON public.connectix_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);