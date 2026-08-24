-- Sample data for manual testing / demo.
-- Password for both users below is: Password123!  (bcrypt hash, 10 rounds)

INSERT INTO users (id, name, email, password_hash)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ayesha Khan', 'ayesha@example.com',
   '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q5b6Bnh1Zqm4bC5EfzQxa5r5r5r5u'),
  ('22222222-2222-2222-2222-222222222222', 'Bilal Ahmed', 'bilal@example.com',
   '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Q5b6Bnh1Zqm4bC5EfzQxa5r5r5r5u')
ON CONFLICT (email) DO NOTHING;

INSERT INTO chat_sessions (id, user_id, messages, status)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '[{"role":"user","text":"Hi, I want to book a haircut","createdAt":"2026-08-20T10:00:00Z"},
    {"role":"bot","text":"Sure! What date and time work for you?","createdAt":"2026-08-20T10:00:02Z"}]'::jsonb,
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (id, user_id, chat_session_id, service_name, appointment_date, appointment_time, status)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'Haircut',
  '2026-08-25',
  '14:30:00',
  'confirmed'
)
ON CONFLICT (id) DO NOTHING;
