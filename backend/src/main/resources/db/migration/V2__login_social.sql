-- Login com Google e Apple: contas sem senha e o identificador fixo da pessoa em cada provedor.
alter table app_user alter column password_hash drop not null;
alter table app_user add column google_sub varchar(255);
alter table app_user add column apple_sub varchar(255);
alter table app_user add constraint uk_user_google_sub unique (google_sub);
alter table app_user add constraint uk_user_apple_sub unique (apple_sub);
