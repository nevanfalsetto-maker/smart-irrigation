import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  "https://gpvfaxoxhsucxhcveyec.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwdmZheG94aHN1Y3hoY3ZleWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTIwOTQsImV4cCI6MjA4ODYyODA5NH0.R8EIpmILPSIuot7XpFcSwdiKPt0DJ85UQHgMhQVeebE"
)