-- 0020_marketing_strategy_seed.sql
-- Seed Layer 1 strategy data: ICPs, personas, competitors. Idempotent.

do $$
declare
  v_workspace_id uuid;
begin
  for v_workspace_id in select id from public.workspaces loop

    -- Tier 1
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_1', 'Premium Indian D2C',
      'VC-backed Indian D2C brands with $1M+ GMV, proven international demand, Series A or later.',
      jsonb_build_object(
        'revenue_min_usd', 1000000,
        'funding', array['series_a', 'series_b', 'series_c', 'growth'],
        'verticals', array['fashion', 'beauty', 'wellness', 'home', 'electronics', 'food'],
        'signals', array['active_us_canada_orders', 'hiring_intl_ops', 'us_canada_retargeting']
      ),
      200000, 2000000, 'abm_executive'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_1'
    );

    -- Tier 2
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_2', 'Growth-Stage Indian D2C',
      'Bootstrap or seed-stage Indian D2C, $200K-$1M GMV, testing US/Canada market.',
      jsonb_build_object(
        'revenue_min_usd', 200000,
        'revenue_max_usd', 1000000,
        'funding', array['bootstrap', 'seed'],
        'verticals', array['fashion', 'beauty', 'wellness', 'home', 'electronics', 'food'],
        'signals', array['occasional_intl_orders', 'founder_led_ops']
      ),
      30000, 200000, 'outbound_sdr_ae'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_2'
    );

    -- Tier 3
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_3', 'Indian Conglomerates',
      'Heritage Indian companies with export divisions, $5M+ in cross-border revenue.',
      jsonb_build_object(
        'revenue_min_usd', 5000000,
        'verticals', array['multi_vertical'],
        'signals', array['established_brand', 'export_division']
      ),
      2000000, null, 'partner_led_csuite'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_3'
    );

    -- Tier 4
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_4', 'Indian Diaspora Brands',
      'Founded in Canada/US by Indian founders, supply chain in India.',
      jsonb_build_object(
        'revenue_min_usd', 50000,
        'revenue_max_usd', 500000,
        'signals', array['na_founded', 'india_supply_chain']
      ),
      50000, 500000, 'community_referral'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_4'
    );

    -- Tier 5
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'tier_5', 'Bootstrap Exporters',
      'Below $200K GMV, mostly Etsy/Amazon sellers expanding internationally.',
      jsonb_build_object(
        'revenue_max_usd', 200000,
        'signals', array['etsy_seller', 'amazon_seller', 'side_hustle']
      ),
      5000, 30000, 'self_serve_inbound'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'tier_5'
    );

    -- NA Mid-Market
    insert into public.icp_profiles (workspace_id, tier, name, description, firmographic_criteria, deal_size_min_usd, deal_size_max_usd, sales_motion)
    select v_workspace_id, 'na_mid_market', 'NA Mid-Market E-Commerce',
      'Mid-market e-commerce brands ($5M-$100M GMV) needing 4PL with cross-border complexity.',
      jsonb_build_object(
        'revenue_min_usd', 5000000,
        'revenue_max_usd', 100000000,
        'geography', array['us', 'canada']
      ),
      500000, 5000000, 'inbound_abm'
    where not exists (
      select 1 from public.icp_profiles
      where workspace_id = v_workspace_id and tier = 'na_mid_market'
    );

    -- Personas for Tier 1
    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'Founder/CEO',
      'Decision maker on strategic expansion',
      jsonb_build_array('Growth ceiling', 'Risk of NA expansion', 'Operational distraction'),
      jsonb_build_array('Unlock the US market without operational overhead', 'Asset-based 4PL — incumbent positioning'),
      jsonb_build_array('founder_thought_leadership', 'strategy_pov', 'case_studies')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'Founder/CEO');

    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'COO/VP Ops',
      'Operations leader concerned with reliability and integration',
      jsonb_build_array('Operational reliability', 'SLAs and uptime', 'Integration complexity'),
      jsonb_build_array('Day-of integration, not multi-quarter migration', 'Vector platform — full visibility'),
      jsonb_build_array('process_documentation', 'sla_proof', 'integration_guides')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'COO/VP Ops');

    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'CFO/Finance Head',
      'Financial decision-maker focused on TCO and unit economics',
      jsonb_build_array('TCO unclear', 'Forex exposure', 'Capital commitment risk'),
      jsonb_build_array('50% cost reduction with predictable per-order pricing'),
      jsonb_build_array('roi_calculator', 'financial_modeling', 'tco_analysis')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'CFO/Finance Head');

    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'Supply Chain Head',
      'Technical evaluator of integration and capability',
      jsonb_build_array('API integration', 'WMS compatibility', 'Technical capability'),
      jsonb_build_array('Vector platform — Shopify-native, REST API, full observability'),
      jsonb_build_array('technical_docs', 'integration_guides', 'api_reference')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'Supply Chain Head');

    insert into public.personas (workspace_id, icp_profile_id, title, role_description, pain_points, hooks, content_recommendations)
    select v_workspace_id, ip.id, 'E-commerce Manager',
      'Owner of customer experience and order operations',
      jsonb_build_array('Order turnaround', 'Returns experience', 'Branded tracking'),
      jsonb_build_array('7-12 day delivery, returns handled, branded tracking'),
      jsonb_build_array('cx_case_studies', 'returns_proof')
    from public.icp_profiles ip
    where ip.workspace_id = v_workspace_id and ip.tier = 'tier_1'
      and not exists (select 1 from public.personas p where p.icp_profile_id = ip.id and p.title = 'E-commerce Manager');

    -- Competitors
    insert into public.competitors (workspace_id, name, website, positioning, profile)
    select v_workspace_id, c.name, c.website, c.positioning, c.profile
    from (values
      ('ShipGlobal', 'https://shipglobal.in', 'India to NA cross-border shipping aggregator. Software-led, no first-party warehousing.',
        '{"asset_based": false, "founded": 2019, "main_lanes": ["india_us", "india_uk"], "weakness": "no_na_warehousing"}'::jsonb),
      ('QuickShip', 'https://quickship.in', 'Indian D2C cross-border with multi-carrier aggregation.',
        '{"asset_based": false, "founded": 2018, "main_lanes": ["india_intl"], "weakness": "no_first_party_assets"}'::jsonb),
      ('Shypmax', 'https://shypmax.com', 'Cross-border parcel delivery for Indian sellers.',
        '{"asset_based": false, "founded": 2018, "weakness": "freight_forwarder_only"}'::jsonb),
      ('Shiprocket X', 'https://shiprocket.in/cross-border', 'Cross-border arm of Shiprocket, India e-commerce shipping platform.',
        '{"asset_based": false, "parent": "shiprocket", "weakness": "platform_play_not_4pl"}'::jsonb),
      ('ShipBob', 'https://shipbob.com', 'NA-focused 3PL with international fulfillment network. Strong in US.',
        '{"asset_based": true, "founded": 2014, "weakness": "no_india_origin_specialty"}'::jsonb),
      ('DHL eCommerce', 'https://dhl.com/global-en/home/ecommerce.html', 'Enterprise carrier, transactional cross-border product.',
        '{"asset_based": true, "incumbent": true, "weakness": "no_4pl_integration_for_d2c"}'::jsonb)
    ) as c(name, website, positioning, profile)
    where not exists (
      select 1 from public.competitors c2
      where c2.workspace_id = v_workspace_id and c2.name = c.name
    );

  end loop;
end$$;
