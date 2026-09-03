-- Add ai_config JSONB column to site_settings table (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'ai_config'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN ai_config JSONB DEFAULT '{
      "active_provider": "gemini",
      "gemini": {
        "api_key": "",
        "model": "gemini-2.5-flash",
        "custom_model": "",
        "temperature": 0.7,
        "max_tokens": 4096
      },
      "openrouter": {
        "api_key": "",
        "model": "google/gemini-2.5-flash",
        "custom_model": "",
        "temperature": 0.7,
        "max_tokens": 4096,
        "site_url": "https://marvelslice.com",
        "site_name": "Marvel Slice Academy"
      }
    }'::jsonb;
  END IF;
END $$;
