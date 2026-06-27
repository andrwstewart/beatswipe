-- Track when a recipient has read a message
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Allow conversation participants (non-senders) to mark messages as read
CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  USING (
    sender_id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  )
  WITH CHECK (true);
