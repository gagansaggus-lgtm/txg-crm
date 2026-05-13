-- 0021_demo_seed_data.sql
-- Demo data so the UI shows realistic content immediately.
-- Idempotent: re-running adds nothing if data already exists (checks by source_external_id).
-- Safe to run in production.

do $$
declare
  v_workspace_id uuid;
  v_lead_id uuid;
  v_seq_id uuid;
  v_owner_id uuid;
  v_tier1_icp uuid;
  v_tier2_icp uuid;
  v_na_icp uuid;
  v_founder_persona uuid;
begin
  select id into v_workspace_id from public.workspaces limit 1;
  if v_workspace_id is null then
    raise notice 'no workspace; skipping seed';
    return;
  end if;

  -- Get first admin/owner profile as default created_by
  select user_id into v_owner_id
  from public.workspace_members
  where workspace_id = v_workspace_id and role in ('admin', 'owner', 'sales')
  limit 1;

  -- Get tier ICP IDs
  select id into v_tier1_icp from public.icp_profiles where workspace_id = v_workspace_id and tier = 'tier_1';
  select id into v_tier2_icp from public.icp_profiles where workspace_id = v_workspace_id and tier = 'tier_2';
  select id into v_na_icp from public.icp_profiles where workspace_id = v_workspace_id and tier = 'na_mid_market';
  select id into v_founder_persona from public.personas where workspace_id = v_workspace_id and title = 'Founder/CEO' limit 1;

  -- ====================== LEADS ======================
  -- NA mid-market e-commerce primary, India D2C secondary

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-maple') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, legal_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status, last_enriched_at, notes)
    values (v_workspace_id, 'manual', 'demo-maple', 'Maple Apparel Co.', 'Maple Apparel Inc.', 'https://mapleapparel.example.com', 'fashion', 'CA', 'Toronto', 8000000, 'series_a', 'contact_verified', v_na_icp, 87, 'A', 'qualified', timezone('utc', now()) - interval '2 days', 'Active conversation. CEO open to pilot. Currently using ShipBob, frustrated with returns.');
  end if;

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-truenorth') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status, last_enriched_at)
    values (v_workspace_id, 'manual', 'demo-truenorth', 'Truenorth Goods', 'https://truenorthgoods.example.com', 'home', 'CA', 'Vancouver', 15000000, 'series_b', 'contact_verified', v_na_icp, 82, 'A', 'call_booked', timezone('utc', now()) - interval '1 day');
  end if;

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-pacific') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status, last_enriched_at)
    values (v_workspace_id, 'manual', 'demo-pacific', 'Pacific Wellness Co.', 'https://pacificwellness.example.com', 'wellness', 'US', 'San Diego', 12000000, 'series_b', 'contact_verified', v_na_icp, 79, 'B', 'replied', timezone('utc', now()) - interval '4 hours');
  end if;

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-boulder') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status, last_enriched_at)
    values (v_workspace_id, 'manual', 'demo-boulder', 'Boulder Outfitters', 'https://boulderoutfitters.example.com', 'outdoor', 'US', 'Denver', 3500000, 'bootstrap', 'icp_scored', v_na_icp, 71, 'B', 'contacted', timezone('utc', now()) - interval '6 hours');
  end if;

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-lakeshore') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status, last_enriched_at)
    values (v_workspace_id, 'manual', 'demo-lakeshore', 'Lakeshore Beauty', 'https://lakeshorebeauty.example.com', 'beauty', 'US', 'Chicago', 6500000, 'series_a', 'contact_verified', v_na_icp, 75, 'B', 'researching', timezone('utc', now()) - interval '8 hours');
  end if;

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-hudson') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status)
    values (v_workspace_id, 'storeleads', 'demo-hudson', 'Hudson Foods', 'https://hudsonfoods.example.com', 'food', 'US', 'New York', 22000000, 'series_b', 'web_verified', v_na_icp, 68, 'C', 'new');
  end if;

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-mountain') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status)
    values (v_workspace_id, 'storeleads', 'demo-mountain', 'Mountain Tech Co.', 'https://mountaintech.example.com', 'electronics', 'US', 'Seattle', 4200000, 'series_a', 'signal_checked', v_na_icp, 72, 'B', 'new');
  end if;

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-vancouver') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status)
    values (v_workspace_id, 'manual', 'demo-vancouver', 'Vancouver Coffee Roasters', 'https://vancouvercoffee.example.com', 'food', 'CA', 'Vancouver', 1800000, 'bootstrap', 'icp_scored', v_na_icp, 64, 'C', 'nurture');
  end if;

  -- India D2C (secondary market)
  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-saffron') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status, last_enriched_at)
    values (v_workspace_id, 'storeleads', 'demo-saffron', 'Saffron Roots', 'https://saffronroots.example.com', 'wellness', 'IN', 'Mumbai', 3000000, 'series_a', 'contact_verified', v_tier2_icp, 76, 'B', 'contacted', timezone('utc', now()) - interval '3 hours');
  end if;

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-himalayan') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, vertical, country, city, estimated_gmv_usd, funding_stage, validation_stage, icp_profile_id, icp_score, icp_grade, status)
    values (v_workspace_id, 'storeleads', 'demo-himalayan', 'Himalayan Textiles', 'https://himalayantextiles.example.com', 'fashion', 'IN', 'Bangalore', 1200000, 'bootstrap', 'signal_checked', v_tier2_icp, 65, 'C', 'new');
  end if;

  -- Rejected leads for funnel visibility
  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-rejected-1') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, validation_stage, rejection_reason, status)
    values (v_workspace_id, 'storeleads', 'demo-rejected-1', 'Dead Site Brand', 'https://deadsite.example.com', 'rejected', 'website_dead', 'do_not_contact');
  end if;

  if not exists (select 1 from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-rejected-2') then
    insert into public.leads (workspace_id, source, source_external_id, display_name, website, validation_stage, rejection_reason, status)
    values (v_workspace_id, 'storeleads', 'demo-rejected-2', 'Inactive Storefront', 'https://inactive.example.com', 'rejected', 'inactive_signals', 'do_not_contact');
  end if;

  -- ====================== LEAD CONTACTS ======================
  -- Add contacts for top leads
  for v_lead_id in
    select id from public.leads
    where workspace_id = v_workspace_id and source_external_id in ('demo-maple', 'demo-truenorth', 'demo-pacific', 'demo-lakeshore')
  loop
    if not exists (select 1 from public.lead_contacts where lead_id = v_lead_id and is_primary = true) then
      insert into public.lead_contacts (workspace_id, lead_id, full_name, role_title, persona_id, email, email_status, linkedin_url, is_primary)
      values (
        v_workspace_id, v_lead_id,
        case (select source_external_id from public.leads where id = v_lead_id)
          when 'demo-maple' then 'Sarah Chen'
          when 'demo-truenorth' then 'Marcus Rivera'
          when 'demo-pacific' then 'Jamie Park'
          when 'demo-lakeshore' then 'Priya Sharma'
        end,
        'Founder & CEO',
        v_founder_persona,
        case (select source_external_id from public.leads where id = v_lead_id)
          when 'demo-maple' then 'sarah@mapleapparel.example.com'
          when 'demo-truenorth' then 'marcus@truenorthgoods.example.com'
          when 'demo-pacific' then 'jamie@pacificwellness.example.com'
          when 'demo-lakeshore' then 'priya@lakeshorebeauty.example.com'
        end,
        'verified',
        'https://linkedin.com/in/demo-' || (select source_external_id from public.leads where id = v_lead_id),
        true
      );
    end if;
  end loop;

  -- ====================== OUTREACH SEQUENCE ======================
  if not exists (select 1 from public.outreach_sequences where workspace_id = v_workspace_id and name = 'NA Fulfillment — Cold (default 9-touch)') then
    insert into public.outreach_sequences (workspace_id, name, description, channels, steps, active, for_icp_tier)
    values (
      v_workspace_id,
      'NA Fulfillment — Cold (default 9-touch)',
      'Multi-channel research-framed outreach over ~50 days. Start with LinkedIn connection, layer email and WhatsApp.',
      array['linkedin_dm', 'email', 'whatsapp', 'linkedin_connection'],
      '[
        {"step_number":1,"channel":"linkedin_connection","day_offset":0,"template":"Hi {{first_name}}, researching how brands like {{company}} handle NA fulfillment. Would love to connect."},
        {"step_number":2,"channel":"email","day_offset":3,"subject":"Researching {{company}}''s NA fulfillment","template":"Hi {{first_name}}, I''m researching how {{vertical}} brands handle their North American fulfillment. {{company}} caught my eye — would you share what''s working and broken right now?"},
        {"step_number":3,"channel":"linkedin_dm","day_offset":7,"template":"Hi {{first_name}} — following up. Quick question: what''s your biggest fulfillment headache right now?"},
        {"step_number":4,"channel":"whatsapp","day_offset":14,"template":"Hi {{first_name}}, this is from TXG. Wanted to make sure my LinkedIn note didn''t slip through."},
        {"step_number":5,"channel":"email","day_offset":21,"subject":"Quick value share","template":"Hi {{first_name}}, sharing one finding: {{vertical}} brands using TXG''s bulk-consolidation model are cutting per-order costs by ~50%."},
        {"step_number":6,"channel":"linkedin_dm","day_offset":35,"template":"Hi {{first_name}}, case study from a {{vertical}} brand — 18 day to 7 day delivery, 22%% to 9%% returns."},
        {"step_number":7,"channel":"email","day_offset":49,"subject":"Last note","template":"Hi {{first_name}}, last nudge. Want to grab 15 min?"}
      ]'::jsonb,
      true,
      'na_mid_market'
    );
  end if;

  select id into v_seq_id from public.outreach_sequences where workspace_id = v_workspace_id and name = 'NA Fulfillment — Cold (default 9-touch)' limit 1;

  -- ====================== OUTREACH MESSAGES (SDR QUEUE) ======================
  -- Draft messages for the top 5 leads, scheduled today/tomorrow
  if v_seq_id is not null and v_owner_id is not null then
    -- Maple Apparel: replied message
    select id into v_lead_id from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-maple';
    if v_lead_id is not null and not exists (select 1 from public.outreach_messages where lead_id = v_lead_id and step_number = 1) then
      insert into public.outreach_messages (workspace_id, sequence_id, lead_id, step_number, channel, body, status, sent_at, replied_at, reply_body, assigned_to)
      values (v_workspace_id, v_seq_id, v_lead_id, 1, 'linkedin_dm',
        'Hi Sarah, researching how brands like Maple Apparel Co. handle NA fulfillment. Would love to connect.',
        'replied', timezone('utc', now()) - interval '3 days', timezone('utc', now()) - interval '2 days',
        'Hi! Yes happy to chat. We''re actually evaluating alternatives to our current 3PL. Send me a calendar link?',
        v_owner_id);
    end if;

    -- Pacific Wellness: replied (positive)
    select id into v_lead_id from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-pacific';
    if v_lead_id is not null and not exists (select 1 from public.outreach_messages where lead_id = v_lead_id and step_number = 2) then
      insert into public.outreach_messages (workspace_id, sequence_id, lead_id, step_number, channel, subject, body, status, sent_at, replied_at, reply_body, assigned_to)
      values (v_workspace_id, v_seq_id, v_lead_id, 2, 'email',
        'Researching Pacific Wellness Co.''s NA fulfillment',
        E'Hi Jamie,\n\nI''m researching how wellness brands handle their North American fulfillment. Pacific Wellness caught my eye — would you share what''s working and broken right now?\n\n— TXG team',
        'replied', timezone('utc', now()) - interval '6 hours', timezone('utc', now()) - interval '4 hours',
        'Interesting timing. Our biggest issue is returns from California — taking 14+ days back to our DC. What does TXG do differently?',
        v_owner_id);
    end if;

    -- Boulder Outfitters: sent, not replied
    select id into v_lead_id from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-boulder';
    if v_lead_id is not null and not exists (select 1 from public.outreach_messages where lead_id = v_lead_id and step_number = 1) then
      insert into public.outreach_messages (workspace_id, sequence_id, lead_id, step_number, channel, body, status, sent_at, assigned_to)
      values (v_workspace_id, v_seq_id, v_lead_id, 1, 'linkedin_dm',
        'Hi there, researching how brands like Boulder Outfitters handle NA fulfillment. Would love to connect.',
        'sent', timezone('utc', now()) - interval '6 hours', v_owner_id);
    end if;

    -- Lakeshore Beauty: drafted, scheduled today
    select id into v_lead_id from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-lakeshore';
    if v_lead_id is not null and not exists (select 1 from public.outreach_messages where lead_id = v_lead_id and step_number = 1) then
      insert into public.outreach_messages (workspace_id, sequence_id, lead_id, step_number, channel, body, status, scheduled_at, assigned_to)
      values (v_workspace_id, v_seq_id, v_lead_id, 1, 'linkedin_dm',
        'Hi Priya, researching how beauty brands like Lakeshore Beauty handle NA fulfillment. Would love to connect.',
        'drafted', timezone('utc', now()) + interval '1 hour', v_owner_id);
    end if;

    -- Lakeshore Beauty step 2: drafted, scheduled day+3
    if v_lead_id is not null and not exists (select 1 from public.outreach_messages where lead_id = v_lead_id and step_number = 2) then
      insert into public.outreach_messages (workspace_id, sequence_id, lead_id, step_number, channel, subject, body, status, scheduled_at, assigned_to)
      values (v_workspace_id, v_seq_id, v_lead_id, 2, 'email',
        'Researching Lakeshore Beauty''s NA fulfillment',
        E'Hi Priya,\n\nI''m researching how beauty brands handle their North American fulfillment. Lakeshore Beauty caught my eye — would you share what''s working and broken right now?\n\n— TXG team',
        'drafted', timezone('utc', now()) + interval '3 days', v_owner_id);
    end if;

    -- Saffron Roots (India): drafted
    select id into v_lead_id from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-saffron';
    if v_lead_id is not null and not exists (select 1 from public.outreach_messages where lead_id = v_lead_id and step_number = 2) then
      insert into public.outreach_messages (workspace_id, sequence_id, lead_id, step_number, channel, subject, body, status, scheduled_at, assigned_to)
      values (v_workspace_id, v_seq_id, v_lead_id, 2, 'email',
        'Selling Saffron Roots in US/Canada?',
        E'Hi there,\n\nI saw Saffron Roots is doing great work in wellness in India. Are you shipping to the US or Canada yet? Most Indian brands quote ₹3,000+ per order and 15-day delivery — we cut that in half. Worth a 15-min call?',
        'drafted', timezone('utc', now()) + interval '2 hours', v_owner_id);
    end if;
  end if;

  -- ====================== ABM ACCOUNTS ======================
  -- Promote top 2 leads to ABM
  select id into v_lead_id from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-maple';
  if v_lead_id is not null and not exists (select 1 from public.abm_accounts where lead_id = v_lead_id) then
    insert into public.abm_accounts (workspace_id, lead_id, tier_priority, status, account_intel, stakeholders)
    values (v_workspace_id, v_lead_id, 1, 'opportunity',
      '{"signals": ["hiring_intl_ops", "high_growth"], "buying_intent": "high"}'::jsonb,
      '[{"role": "Founder & CEO", "name": "Sarah Chen"}, {"role": "COO", "name": "David Liu"}]'::jsonb);
  end if;

  select id into v_lead_id from public.leads where workspace_id = v_workspace_id and source_external_id = 'demo-truenorth';
  if v_lead_id is not null and not exists (select 1 from public.abm_accounts where lead_id = v_lead_id) then
    insert into public.abm_accounts (workspace_id, lead_id, tier_priority, status, stakeholders)
    values (v_workspace_id, v_lead_id, 1, 'engaged',
      '[{"role": "Founder", "name": "Marcus Rivera"}, {"role": "VP Ops", "name": "Lena Wong"}]'::jsonb);
  end if;

  -- ====================== CONTENT PIECES ======================
  if not exists (select 1 from public.content_pieces where workspace_id = v_workspace_id and title = 'What is a 4PL and why D2C brands should care') then
    insert into public.content_pieces (workspace_id, content_type, status, pillar, title, slug, excerpt, body, target_keyword, secondary_keywords, seo_title, seo_description, created_by, author_id)
    values (v_workspace_id, 'seo_article', 'published', 'education', 'What is a 4PL and why D2C brands should care', 'what-is-4pl-d2c-brands',
      'Most D2C brands think they need a 3PL. They actually need a 4PL. Here''s the difference, and why it matters.',
      E'A 3PL moves goods. A 4PL **owns the strategy behind moving goods** — managing other providers, integrating technology, and operating as an extension of your supply chain leadership.\n\nFor D2C brands scaling past $1M GMV, the difference is the difference between firefighting and growth.\n\n[full article body...]',
      'what is a 4pl',
      array['4pl vs 3pl', 'fourth party logistics', '4pl for ecommerce'],
      'What is a 4PL? Difference vs 3PL for D2C brands explained',
      'A 4PL manages your entire supply chain, not just shipping. For D2C brands above $1M GMV, this is the operational leverage you''ve been missing.',
      v_owner_id, v_owner_id);
  end if;

  if not exists (select 1 from public.content_pieces where workspace_id = v_workspace_id and title = 'Cutting NA delivery from 18 to 7 days: a case study') then
    insert into public.content_pieces (workspace_id, content_type, status, pillar, title, slug, excerpt, created_by, author_id, scheduled_at)
    values (v_workspace_id, 'seo_article', 'scheduled', 'proof', 'Cutting NA delivery from 18 to 7 days: a case study', 'na-delivery-18-to-7-days',
      'How one wellness brand went from 18-day delivery and 22% returns to 7-day delivery and 9% returns in 90 days.',
      v_owner_id, v_owner_id, timezone('utc', now()) + interval '2 days');
  end if;

  if not exists (select 1 from public.content_pieces where workspace_id = v_workspace_id and title = 'The hidden cost of Amazon FBA for D2C brands') then
    insert into public.content_pieces (workspace_id, content_type, status, pillar, title, slug, excerpt, created_by, author_id)
    values (v_workspace_id, 'seo_article', 'in_review', 'pain_solution', 'The hidden cost of Amazon FBA for D2C brands', 'hidden-cost-amazon-fba',
      'FBA fees look reasonable until you add storage, removal, return processing, and aged inventory penalties. Here''s the real math.',
      v_owner_id, v_owner_id);
  end if;

  if not exists (select 1 from public.content_pieces where workspace_id = v_workspace_id and title = 'Why I left my old 3PL — Gagan Saggu''s take') then
    insert into public.content_pieces (workspace_id, content_type, status, pillar, title, body, target_persona_id, scheduled_at, created_by, author_id)
    values (v_workspace_id, 'linkedin_post', 'approved', 'authority', 'Why I left my old 3PL — Gagan Saggu''s take',
      E'After 12 years running Transway Transport, here''s what I learned about 3PL relationships:\n\nMost are transactional. You pay per shipment. They optimize for their costs, not yours.\n\nA 4PL is different. We own the outcome.\n\nFor brands sending us 10K+ orders/month, we''re inside their P&L. We know their margin per category. We know which SKUs are pulling weight.\n\nThat''s the real difference. Not the warehouse footprint. The accountability.\n\n#fulfillment #4pl #ecommerce',
      v_founder_persona, timezone('utc', now()) + interval '1 day', v_owner_id, v_owner_id);
  end if;

  if not exists (select 1 from public.content_pieces where workspace_id = v_workspace_id and title = '5 questions to ask your 3PL before renewing') then
    insert into public.content_pieces (workspace_id, content_type, status, pillar, title, body, created_by, author_id)
    values (v_workspace_id, 'linkedin_post', 'draft', 'education', '5 questions to ask your 3PL before renewing',
      E'Renewal season for most D2C brands.\n\nBefore you sign, ask:\n\n1. What''s my actual landed cost per order, including all surcharges?\n2. What''s your peak-season uplift policy?\n3. How fast do you replace damaged inventory?\n4. What''s your real returns processing SLA?\n5. Can I see live shipment data without filing a ticket?\n\nIf they can''t answer 4 of 5, you''re paying for a vendor, not a partner.',
      v_owner_id, v_owner_id);
  end if;

  -- ====================== SOCIAL POSTS ======================
  if not exists (select 1 from public.social_posts where workspace_id = v_workspace_id and body like '12 years of trucking%') then
    insert into public.social_posts (workspace_id, platform, body, status, posted_at, created_by, performance)
    values (v_workspace_id, 'linkedin_company',
      E'12 years of trucking. 3 years of TXG.\n\nWhat we''ve learned: brands don''t want a vendor. They want a partner who knows their P&L.\n\nThat''s why we''re building TXG Vector — a marketing & sales OS that runs alongside our fulfillment ops.',
      'posted', timezone('utc', now()) - interval '5 days', v_owner_id,
      '{"impressions": 2840, "engagements": 89, "comments": 12, "reactions": 67}'::jsonb);
  end if;

  if not exists (select 1 from public.social_posts where workspace_id = v_workspace_id and body like 'Most 3PLs sell capacity%') then
    insert into public.social_posts (workspace_id, platform, body, status, scheduled_at, created_by)
    values (v_workspace_id, 'linkedin_company',
      E'Most 3PLs sell capacity. We sell outcomes.\n\nA case study going live tomorrow: how a wellness brand went from 18 to 7 day NA delivery with us. Comment "case" and I''ll DM it to you.',
      'scheduled', timezone('utc', now()) + interval '1 day', v_owner_id);
  end if;

  if not exists (select 1 from public.social_posts where workspace_id = v_workspace_id and body like 'Behind-the-scenes%') then
    insert into public.social_posts (workspace_id, platform, body, status, scheduled_at, created_by)
    values (v_workspace_id, 'instagram',
      E'Behind-the-scenes at our Etobicoke facility — same-day cross-border processing for Canada-to-US shipments. 🇨🇦↔️🇺🇸\n\n#fulfillment #4pl #ecommerce #canada',
      'scheduled', timezone('utc', now()) + interval '2 days', v_owner_id);
  end if;

  -- ====================== PARTNERS ======================
  if not exists (select 1 from public.partners where workspace_id = v_workspace_id and name = 'Shopify Plus') then
    insert into public.partners (workspace_id, name, partner_type, website, agreement_status, primary_contact_name, primary_contact_email, referral_pipeline_value_usd, referrals_received, notes)
    values (v_workspace_id, 'Shopify Plus', 'tech', 'https://shopify.com', 'negotiating', 'Alex Kim', 'alex.kim@shopify.example.com', 250000, 3,
      'Tech partner. Building Shopify-native integration. Co-marketing planned Q3.');
  end if;

  if not exists (select 1 from public.partners where workspace_id = v_workspace_id and name = 'Stripe Canada') then
    insert into public.partners (workspace_id, name, partner_type, agreement_status, referral_pipeline_value_usd, referrals_received)
    values (v_workspace_id, 'Stripe Canada', 'channel', 'signed', 180000, 5);
  end if;

  if not exists (select 1 from public.partners where workspace_id = v_workspace_id and name = 'Y Combinator (W26 batch)') then
    insert into public.partners (workspace_id, name, partner_type, agreement_status, referrals_received, notes)
    values (v_workspace_id, 'Y Combinator (W26 batch)', 'strategic', 'prospect', 0, 'Outreach in progress. Targeting D2C founders in the batch.');
  end if;

  -- ====================== PR CONTACTS + PRESS PIECES ======================
  if not exists (select 1 from public.pr_contacts where workspace_id = v_workspace_id and full_name = 'Maria Gonzalez') then
    insert into public.pr_contacts (workspace_id, full_name, publication, role_title, beat, email, last_pitched_at, responded_count)
    values (v_workspace_id, 'Maria Gonzalez', 'FreightWaves', 'Senior Editor, E-Commerce Logistics', 'e-commerce, 3PL, fulfillment', 'maria.g@freightwaves.example.com', timezone('utc', now()) - interval '1 week', 1);
  end if;

  if not exists (select 1 from public.pr_contacts where workspace_id = v_workspace_id and full_name = 'Tom Bradshaw') then
    insert into public.pr_contacts (workspace_id, full_name, publication, role_title, beat, email)
    values (v_workspace_id, 'Tom Bradshaw', 'Supply Chain Dive', 'Reporter', 'fulfillment, last-mile, returns', 'tom.b@supplychaindive.example.com');
  end if;

  if not exists (select 1 from public.press_pieces where workspace_id = v_workspace_id and title = 'TXG named in Top 25 4PL providers in North America') then
    insert into public.press_pieces (workspace_id, title, status, publication, published_url, published_at)
    values (v_workspace_id, 'TXG named in Top 25 4PL providers in North America', 'published', 'Logistics Today', 'https://logisticstoday.example.com/txg-top-25', current_date - 30);
  end if;

  if not exists (select 1 from public.press_pieces where workspace_id = v_workspace_id and title = 'Cross-border fulfillment trends for Q3 2026') then
    insert into public.press_pieces (workspace_id, title, status, pitch_body)
    values (v_workspace_id, 'Cross-border fulfillment trends for Q3 2026', 'pitched',
      'Pitching to FreightWaves: data on US-Canada cross-border volumes through TXG facilities, trend analysis on D2C international shipping costs.');
  end if;

  -- ====================== EVENTS ======================
  if not exists (select 1 from public.events where workspace_id = v_workspace_id and name = 'eTail Canada 2026') then
    insert into public.events (workspace_id, name, event_type, start_date, end_date, location, status, cost_usd, notes)
    values (v_workspace_id, 'eTail Canada 2026', 'conference', current_date + 45, current_date + 47, 'Toronto, ON', 'confirmed', 8000,
      'Booth + 1 speaking session. Target: 30 demos booked, 10 qualified opps.');
  end if;

  if not exists (select 1 from public.events where workspace_id = v_workspace_id and name = 'D2C Founder Roundtable — Vancouver') then
    insert into public.events (workspace_id, name, event_type, start_date, location, status, notes)
    values (v_workspace_id, 'D2C Founder Roundtable — Vancouver', 'meetup', current_date + 14, 'Vancouver, BC', 'planned',
      'Intimate dinner. 12 founders. Co-hosted with Stripe Canada.');
  end if;

  -- ====================== INFLUENCERS ======================
  if not exists (select 1 from public.influencers where workspace_id = v_workspace_id and name = 'Aman Gupta (boAt)') then
    insert into public.influencers (workspace_id, name, primary_platform, follower_count, niche, notes)
    values (v_workspace_id, 'Aman Gupta (boAt)', 'linkedin', 1200000, 'D2C founder, e-commerce, India',
      'Outreach in progress. Targeting podcast appearance for Gagan to discuss India→NA cross-border.');
  end if;

  if not exists (select 1 from public.influencers where workspace_id = v_workspace_id and name = 'Sarah Tavel (Benchmark)') then
    insert into public.influencers (workspace_id, name, primary_platform, follower_count, niche)
    values (v_workspace_id, 'Sarah Tavel (Benchmark)', 'twitter', 95000, 'D2C, marketplace, venture');
  end if;

  -- ====================== LEAD MAGNETS ======================
  if not exists (select 1 from public.lead_magnets where workspace_id = v_workspace_id and slug = 'na-fulfillment-playbook') then
    insert into public.lead_magnets (workspace_id, title, slug, description, page_count, active, download_count)
    values (v_workspace_id, 'The North American Fulfillment Playbook for D2C Brands', 'na-fulfillment-playbook',
      '32-page playbook: choosing a 3PL vs 4PL, NA logistics network mapping, cross-border tax implications, returns strategy.',
      32, true, 47);
  end if;

  if not exists (select 1 from public.lead_magnets where workspace_id = v_workspace_id and slug = 'india-to-usa-shipping-guide') then
    insert into public.lead_magnets (workspace_id, title, slug, description, page_count, active, download_count)
    values (v_workspace_id, 'India → USA Shipping: The Complete Guide', 'india-to-usa-shipping-guide',
      'Cost breakdowns, customs requirements, FEMA compliance, the three shipping models for Indian D2C brands.',
      24, true, 18);
  end if;

  -- ====================== BRAND ASSETS ======================
  if not exists (select 1 from public.brand_assets where workspace_id = v_workspace_id and name = 'Primary logo') then
    insert into public.brand_assets (workspace_id, asset_type, name, description, file_url, created_by)
    values (v_workspace_id, 'logo', 'Primary logo', 'Full-color version for use on white/light backgrounds', 'https://transwayxpress.com/logo.png', v_owner_id);
  end if;

  if not exists (select 1 from public.brand_assets where workspace_id = v_workspace_id and name = 'TXG orange + navy palette') then
    insert into public.brand_assets (workspace_id, asset_type, name, description, metadata, created_by)
    values (v_workspace_id, 'palette', 'TXG orange + navy palette', 'Brand colors with hex codes',
      '{"colors": [{"name": "TXG Orange", "hex": "#f75928"}, {"name": "Deep Navy", "hex": "#0d1e3d"}, {"name": "Off-white", "hex": "#f5f6f8"}]}'::jsonb, v_owner_id);
  end if;

  if not exists (select 1 from public.brand_assets where workspace_id = v_workspace_id and name = 'Manrope + DM Sans typography') then
    insert into public.brand_assets (workspace_id, asset_type, name, description, created_by)
    values (v_workspace_id, 'typography', 'Manrope + DM Sans typography', 'Manrope for headlines (700-800 weight), DM Sans for body (400-500 weight), Nunito Sans for display (900)', v_owner_id);
  end if;

  -- ====================== SALES ASSETS ======================
  if not exists (select 1 from public.sales_assets where workspace_id = v_workspace_id and name = 'TXG Master Pitch Deck v2.1') then
    insert into public.sales_assets (workspace_id, asset_type, name, description, version, active)
    values (v_workspace_id, 'pitch_deck', 'TXG Master Pitch Deck v2.1', 'Standard 12-slide pitch for D2C founders', '2.1', true);
  end if;

  if not exists (select 1 from public.sales_assets where workspace_id = v_workspace_id and name = 'Maple Apparel — Custom one-pager') then
    insert into public.sales_assets (workspace_id, asset_type, name, description, for_icp_tier, version, active)
    values (v_workspace_id, 'case_study_one_pager', 'Maple Apparel — Custom one-pager', 'Account-specific one-pager for Maple Apparel pitch', 'na_mid_market', '1.0', true);
  end if;

  if not exists (select 1 from public.sales_assets where workspace_id = v_workspace_id and name = 'ROI Calculator (internal)') then
    insert into public.sales_assets (workspace_id, asset_type, name, description, version, active)
    values (v_workspace_id, 'roi_calculator_internal', 'ROI Calculator (internal)', 'Spreadsheet for sales calls — input current cost-per-order, output TXG savings', '1.3', true);
  end if;

  -- ====================== COMPETITOR SIGNALS ======================
  insert into public.competitor_signals (workspace_id, competitor_id, signal_type, content, source_url)
  select v_workspace_id, c.id, 'pricing_change',
    'Raised per-order fees by 15% effective Q2. Removed free returns processing from base tier.',
    'https://shipbob.example.com/pricing-update'
  from public.competitors c
  where c.workspace_id = v_workspace_id and c.name = 'ShipBob'
    and not exists (
      select 1 from public.competitor_signals cs
      where cs.competitor_id = c.id and cs.signal_type = 'pricing_change' and cs.content like 'Raised per-order%'
    )
  limit 1;

  insert into public.competitor_signals (workspace_id, competitor_id, signal_type, content)
  select v_workspace_id, c.id, 'hire',
    'New VP of Sales — Jennifer Walsh, formerly at Flexport. Public LinkedIn announcement.'
  from public.competitors c
  where c.workspace_id = v_workspace_id and c.name = 'ShipGlobal'
    and not exists (
      select 1 from public.competitor_signals cs
      where cs.competitor_id = c.id and cs.signal_type = 'hire' and cs.content like '%Jennifer Walsh%'
    )
  limit 1;

  -- ====================== COMMUNITY MEMBERS ======================
  if not exists (select 1 from public.community_members where workspace_id = v_workspace_id and channel = 'whatsapp' and display_name = 'D2C Founder Group (12 active)') then
    insert into public.community_members (workspace_id, channel, display_name, source, joined_at, engagement_score, status, metadata)
    values
      (v_workspace_id, 'whatsapp', 'Founders Network — Toronto', 'eTail event', timezone('utc', now()) - interval '14 days', 8, 'active', '{}'::jsonb),
      (v_workspace_id, 'whatsapp', 'NA D2C Operators', 'Stripe partner intro', timezone('utc', now()) - interval '7 days', 6, 'active', '{}'::jsonb),
      (v_workspace_id, 'telegram', 'India Cross-Border Brands', 'Saffron Roots referral', timezone('utc', now()) - interval '3 days', 4, 'active', '{}'::jsonb),
      (v_workspace_id, 'linkedin_group', 'Logistics Leaders NA', 'self-join', timezone('utc', now()) - interval '21 days', 7, 'active', '{}'::jsonb);
  end if;

  -- ====================== SOCIAL MENTIONS ======================
  if not exists (select 1 from public.social_mentions where workspace_id = v_workspace_id and mention_text like '%4PL%shipbob%') then
    insert into public.social_mentions (workspace_id, source_platform, mention_text, source_url, author_handle, sentiment, intent_signal, observed_at)
    values
      (v_workspace_id, 'twitter',
        'Anyone using a 4PL instead of ShipBob for cross-border? Their pricing is killing our margins.',
        'https://twitter.com/example/status/123', 'd2c_founder_anon', 'negative', 'buying_signal', timezone('utc', now()) - interval '2 hours'),
      (v_workspace_id, 'linkedin',
        'Tip for NA D2C brands: don''t accept "industry standard" 15-day returns. Negotiate harder or switch 3PLs.',
        'https://linkedin.com/posts/example', 'sarah_chen_maple', 'neutral', 'pain_point', timezone('utc', now()) - interval '8 hours'),
      (v_workspace_id, 'reddit',
        'TXG looks interesting for cross-border. Anyone here used them?',
        'https://reddit.com/r/ecommerce/example', 'reddit_user_42', 'positive', 'brand_mention', timezone('utc', now()) - interval '1 day');
  end if;

  -- ====================== ACTIVITY LOG ======================
  -- Log the demo seed event itself
  if not exists (select 1 from public.activities where workspace_id = v_workspace_id and subject = 'Demo seed data loaded') then
    insert into public.activities (workspace_id, kind, subject, body, occurred_at, author_id)
    values (v_workspace_id, 'note', 'Demo seed data loaded',
      'Initial demo data added: 10 leads, 1 sequence, 6 outreach messages, 5 content pieces, 3 social posts, 3 partners, 2 PR contacts, 2 events, 2 influencers, 2 lead magnets, 3 brand assets, 3 sales assets, 2 competitor signals, 4 community members, 3 social mentions.',
      timezone('utc', now()), v_owner_id);
  end if;
end$$;
