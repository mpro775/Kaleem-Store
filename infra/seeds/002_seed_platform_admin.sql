INSERT INTO platform_admin_permissions (id, key, description)
VALUES
  ('9761fce2-58e3-4b46-bcf1-c8bd3ec06a01', 'platform.dashboard.read', 'Read platform dashboard'),
  ('05be9cae-4d12-4c4c-9da8-cb02e18dcf02', 'platform.stores.read', 'Read stores list and details'),
  ('9e4a81b2-34b7-44d5-bec5-b59f8ec1cb03', 'platform.stores.write', 'Manage stores'),
  ('595157fd-9365-45c5-aa7d-c8dfa5f87d04', 'platform.stores.suspend', 'Suspend stores'),
  ('99a8cf80-25de-4926-bf4c-89b8f0105105', 'platform.stores.resume', 'Resume stores'),
  ('ee2642de-b714-4ab4-922b-b7f453130006', 'platform.plans.read', 'Read plans'),
  ('8f4531e7-07f1-4b56-9de0-7fbc5b477007', 'platform.plans.write', 'Manage plans'),
  ('0d5c47f2-9d5a-43e3-9a0f-8f640fd8ea08', 'platform.subscriptions.read', 'Read subscriptions'),
  ('f769236d-2e97-46dc-ac99-a71ec5597809', 'platform.subscriptions.write', 'Manage subscriptions'),
  ('3924dac8-e09e-4f44-b403-cd4777134510', 'platform.domains.read', 'Read domains'),
  ('43f785df-eb53-4750-b436-2e1ebca9d111', 'platform.domains.write', 'Manage domains'),
  ('35226de5-46d9-4817-88e4-f68fcd0e8d12', 'platform.audit.read', 'Read platform audit logs'),
  ('d6fdb6e6-373f-4f65-8368-6402f92c6d13', 'platform.admins.read', 'Read platform admins'),
  ('1ef6cf13-7af9-48f4-857f-ff537737f614', 'platform.admins.write', 'Manage platform admins'),
  ('17d0d1e0-0b5a-4f90-82ca-98ee2dc2c215', 'platform.roles.read', 'Read platform roles'),
  ('fc86230c-0b26-4507-a47b-cbc11fa39d16', 'platform.roles.write', 'Manage platform roles'),
  ('ebea3650-83df-4b3e-984a-db722925f617', 'platform.settings.read', 'Read platform settings'),
  ('e3de30a3-c0d6-4f20-ab65-fb86df24dd18', 'platform.settings.write', 'Manage platform settings'),
  ('8a5298b1-8896-4b0d-a9ea-f4cc39926619', 'platform.onboarding.read', 'Read onboarding pipeline'),
  ('00df5009-7c3f-4e3d-ae2c-1e8c346d0d20', 'platform.onboarding.write', 'Manage onboarding pipeline')
ON CONFLICT (key) DO NOTHING;

INSERT INTO platform_admin_roles (id, name, code, description)
VALUES
  ('69afb7b5-f2e6-47ce-b780-085ed8239b41', 'Super Admin', 'super_admin', 'Full platform access'),
  ('fe552e6f-c25e-4907-9d35-e8d7af05d542', 'Operations Manager', 'ops_manager', 'Daily platform operations'),
  ('a053f377-ec95-4cfb-af6b-1762acf9f543', 'Support Agent', 'support_agent', 'Support operations access'),
  ('2d74a496-2e98-4214-8e3a-6623f2c16a44', 'Finance Admin', 'finance_admin', 'Billing and plan operations'),
  ('e43af5af-cd5b-4707-8c4e-6b927d571a45', 'Auditor', 'auditor', 'Read-only platform audit access')
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform_admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM platform_admin_roles r
CROSS JOIN platform_admin_permissions p
WHERE LOWER(r.code) = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO platform_admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM platform_admin_roles r
INNER JOIN platform_admin_permissions p
  ON p.key IN (
    'platform.dashboard.read',
    'platform.stores.read',
    'platform.stores.write',
    'platform.stores.suspend',
    'platform.stores.resume',
    'platform.subscriptions.read',
    'platform.subscriptions.write',
    'platform.domains.read',
    'platform.domains.write',
    'platform.audit.read',
    'platform.onboarding.read',
    'platform.onboarding.write'
  )
WHERE LOWER(r.code) = 'ops_manager'
ON CONFLICT DO NOTHING;

INSERT INTO platform_admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM platform_admin_roles r
INNER JOIN platform_admin_permissions p
  ON p.key IN (
    'platform.dashboard.read',
    'platform.stores.read',
    'platform.subscriptions.read',
    'platform.subscriptions.write',
    'platform.domains.read',
    'platform.domains.write',
    'platform.onboarding.read',
    'platform.onboarding.write'
  )
WHERE LOWER(r.code) = 'support_agent'
ON CONFLICT DO NOTHING;

INSERT INTO platform_admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM platform_admin_roles r
INNER JOIN platform_admin_permissions p
  ON p.key IN (
    'platform.dashboard.read',
    'platform.plans.read',
    'platform.plans.write',
    'platform.subscriptions.read',
    'platform.subscriptions.write',
    'platform.audit.read'
  )
WHERE LOWER(r.code) = 'finance_admin'
ON CONFLICT DO NOTHING;

INSERT INTO platform_admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM platform_admin_roles r
INNER JOIN platform_admin_permissions p
  ON p.key IN (
    'platform.dashboard.read',
    'platform.stores.read',
    'platform.subscriptions.read',
    'platform.domains.read',
    'platform.audit.read',
    'platform.plans.read'
  )
WHERE LOWER(r.code) = 'auditor'
ON CONFLICT DO NOTHING;
