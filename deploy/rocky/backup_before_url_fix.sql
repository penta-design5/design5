--
-- PostgreSQL database dump
--

\restrict gnkFpvC6eESGctE2jAVasAQeDMI2IYclM8lbdSycaGOeCnM8T6J2JPsHwb0ifK4

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: design5
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO design5;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: design5
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO design5;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: design5
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO design5;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: design5
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO design5;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: design5
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO design5;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: design5
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO design5;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: design5
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO design5;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: design5
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO design5;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: design5
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO design5;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: design5
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO design5;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: design5
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO design5;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: design5
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO design5;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: design5
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO design5;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: design5
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO design5;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: design5
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO design5;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: design5
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO design5;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: design5
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO design5;

--
-- Name: CategoryType; Type: TYPE; Schema: public; Owner: design5
--

CREATE TYPE public."CategoryType" AS ENUM (
    'WORK',
    'SOURCE',
    'TEMPLATE',
    'BROCHURE',
    'ADMIN',
    'ETC'
);


ALTER TYPE public."CategoryType" OWNER TO design5;

--
-- Name: DesignRequestStatus; Type: TYPE; Schema: public; Owner: design5
--

CREATE TYPE public."DesignRequestStatus" AS ENUM (
    'REQUESTED',
    'IN_PROGRESS',
    'COMPLETED'
);


ALTER TYPE public."DesignRequestStatus" OWNER TO design5;

--
-- Name: PostStatus; Type: TYPE; Schema: public; Owner: design5
--

CREATE TYPE public."PostStatus" AS ENUM (
    'PUBLISHED',
    'DRAFT',
    'ARCHIVED'
);


ALTER TYPE public."PostStatus" OWNER TO design5;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: design5
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'MEMBER'
);


ALTER TYPE public."UserRole" OWNER TO design5;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: design5
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO design5;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: design5
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO design5;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: design5
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO design5;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: design5
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO design5;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: design5
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO design5;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: design5
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO design5;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: design5
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO design5;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: design5
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO design5;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: design5
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO design5;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: design5
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO design5;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: design5
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO design5;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: design5
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: design5
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO design5;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: design5
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: design5
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO design5;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: design5
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: design5
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO design5;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: design5
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO design5;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: design5
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO design5;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: design5
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: design5
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO design5;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO design5;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO design5;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO design5;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO design5;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO design5;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO design5;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL AND ppt.tablename NOT LIKE '% %'),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  -- Count raw slot entries before apply_rls/subscription filter
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  -- Apply RLS and filter as before
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  -- Real rows with slot count attached
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  -- Sentinel row: always returned when no real rows exist so Elixir can
  -- always read slot_changes_count. Identified by wal IS NULL.
  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO design5;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO design5;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO design5;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO design5;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO design5;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: design5
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO design5;

--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO design5;

--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO design5;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO design5;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO design5;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO design5;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO design5;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO design5;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO design5;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO design5;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO design5;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO design5;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO design5;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO design5;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO design5;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO design5;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO design5;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO design5;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO design5;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO design5;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO design5;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO design5;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: design5
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO design5;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO design5;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO design5;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO design5;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO design5;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO design5;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO design5;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO design5;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO design5;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO design5;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO design5;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO design5;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO design5;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO design5;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO design5;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: design5
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO design5;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: design5
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO design5;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO design5;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO design5;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO design5;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO design5;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO design5;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO design5;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO design5;

--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: design5
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO design5;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO design5;

--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.app_settings (
    id text DEFAULT 'default'::text NOT NULL,
    "showCredentialsLogin" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.app_settings OWNER TO design5;

--
-- Name: card_templates; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.card_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "thumbnailUrl" text,
    "backgroundImages" jsonb NOT NULL,
    width integer DEFAULT 1080 NOT NULL,
    height integer DEFAULT 1920 NOT NULL,
    config jsonb NOT NULL,
    status text DEFAULT 'PUBLISHED'::text NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.card_templates OWNER TO design5;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    type public."CategoryType" NOT NULL,
    "pageType" text,
    config jsonb,
    "parentId" text,
    "order" integer DEFAULT 0 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO design5;

--
-- Name: design_requests; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.design_requests (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "departmentTeam" text NOT NULL,
    "dueDate" date NOT NULL,
    status public."DesignRequestStatus" DEFAULT 'REQUESTED'::public."DesignRequestStatus" NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.design_requests OWNER TO design5;

--
-- Name: desktop_wallpapers; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.desktop_wallpapers (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "thumbnailUrl" text,
    "backgroundUrlWindows" text,
    "backgroundUrlMac" text,
    "widthWindows" integer DEFAULT 2560 NOT NULL,
    "heightWindows" integer DEFAULT 1440 NOT NULL,
    "widthMac" integer DEFAULT 2560 NOT NULL,
    "heightMac" integer DEFAULT 1600 NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.desktop_wallpapers OWNER TO design5;

--
-- Name: diagram_zip_config; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.diagram_zip_config (
    id text NOT NULL,
    key text DEFAULT 'default'::text NOT NULL,
    "zipFileUrl" text,
    "zipFileName" text,
    "zipFileSize" integer,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.diagram_zip_config OWNER TO design5;

--
-- Name: diagrams; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.diagrams (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "thumbnailUrl" text,
    "canvasData" jsonb NOT NULL,
    width integer DEFAULT 1920 NOT NULL,
    height integer DEFAULT 1080 NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.diagrams OWNER TO design5;

--
-- Name: edms; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.edms (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "thumbnailUrl" text,
    "imageWidth" integer NOT NULL,
    "imageHeight" integer NOT NULL,
    "gridConfig" jsonb NOT NULL,
    "cellLinks" jsonb NOT NULL,
    "cellImages" jsonb NOT NULL,
    "htmlCode" text,
    alignment text DEFAULT 'left'::text NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.edms OWNER TO design5;

--
-- Name: notices; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.notices (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "isImportant" boolean DEFAULT false NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    attachments jsonb,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notices OWNER TO design5;

--
-- Name: post_tags; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.post_tags (
    id text NOT NULL,
    "postId" text NOT NULL,
    "tagId" text NOT NULL
);


ALTER TABLE public.post_tags OWNER TO design5;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.posts (
    id text NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    "thumbnailUrl" text,
    "fileUrl" text NOT NULL,
    images jsonb,
    "fileSize" integer NOT NULL,
    "fileType" text NOT NULL,
    "mimeType" text,
    "categoryId" text NOT NULL,
    status public."PostStatus" DEFAULT 'PUBLISHED'::public."PostStatus" NOT NULL,
    "isEditable" boolean DEFAULT false NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "downloadCount" integer DEFAULT 0 NOT NULL,
    concept text,
    tool text,
    "producedAt" timestamp(3) without time zone,
    "authorId" text NOT NULL,
    "updatedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.posts OWNER TO design5;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.tags (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tags OWNER TO design5;

--
-- Name: users; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password text,
    avatar text,
    role public."UserRole" DEFAULT 'MEMBER'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO design5;

--
-- Name: welcomeboard_templates; Type: TABLE; Schema: public; Owner: design5
--

CREATE TABLE public.welcomeboard_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "thumbnailUrl" text,
    "backgroundUrl" text NOT NULL,
    width integer DEFAULT 1920 NOT NULL,
    height integer DEFAULT 1080 NOT NULL,
    config jsonb NOT NULL,
    status text DEFAULT 'PUBLISHED'::text NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.welcomeboard_templates OWNER TO design5;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: design5
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO design5;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: design5
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO design5;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: design5
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO design5;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: design5
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: design5
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO design5;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: design5
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: design5
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO design5;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: design5
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO design5;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: design5
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO design5;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: design5
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO design5;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: design5
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: design5
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO design5;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: design5
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO design5;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: design5
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO design5;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: design5
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
cedd5f66-0da5-4aaf-97e0-00665fa89593	ed4f697c04b0222eeba4faf2d5ab9ad2f829bc6d2cd708ef2a68845912576ef0	2026-01-14 01:22:48.408779+00	20260114012248_add_produced_at	\N	\N	2026-01-14 01:22:48.349646+00	1
a592406a-01d5-486d-8e8a-ce824a1f316d	26bfd124c97a694cedd58a1dbc7846597931c0b2a637185688496521f987f94e	2026-01-28 04:17:33.510762+00	20260128131704_add_diagram_model	\N	\N	2026-01-28 04:17:33.442825+00	1
30cf88d9-1ec1-4de3-830a-d0525d4c1cf6	9e38ef46f46bd7a325c1b5ca9a58b80768982b2d7002548bbc91388e41a638b8	\N	20260130000000_add_diagram_zip_config	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260130000000_add_diagram_zip_config\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "diagram_zip_config" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"diagram_zip_config\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1160), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260130000000_add_diagram_zip_config"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260130000000_add_diagram_zip_config"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2026-01-30 03:04:03.188773+00	2026-01-30 03:03:54.958593+00	0
c719af7a-466f-4a35-a32e-00fde01b346e	9e38ef46f46bd7a325c1b5ca9a58b80768982b2d7002548bbc91388e41a638b8	2026-01-30 03:04:03.205733+00	20260130000000_add_diagram_zip_config		\N	2026-01-30 03:04:03.205733+00	0
cfe4c111-3498-45bc-b583-18d1453c3f24	d6c73567bd59855115afcc13577cf4590f976105c8134cddec88009c42b2cf7d	2026-01-30 03:04:10.617392+00	20260130100000_add_edm_model	\N	\N	2026-01-30 03:04:10.455584+00	1
4be96406-5d88-40ec-8383-5dddbd6d20c7	5586e7f5de1a92e5d0781c1e3acfe26ede437a7cc1f856b6ebce83fe57a0bf6f	2026-02-11 05:09:35.675292+00	20260211000000_add_card_templates	\N	\N	2026-02-11 05:09:35.455586+00	1
0a08d496-f8c8-4282-8cb8-f935b2e1aa72	2f35a8637006ae2cfda85548a2055aceaff20cd8cc012f7b3b20e74c2cd043c5	2026-04-02 05:54:12.468249+00	20260402120000_add_design_request	\N	\N	2026-04-02 05:54:12.352555+00	1
50850fe0-1a21-4345-b978-6971cd5d1855	31acc78f728fb50f9896d6a8587bb0a69380b460cfcc307f4db1f1e3d78e9410	2026-04-27 23:40:53.944187+00	20260427120000_baseline		\N	2026-04-27 23:40:53.944187+00	0
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.app_settings (id, "showCredentialsLogin", "updatedAt") FROM stdin;
default	t	2026-04-29 03:29:01.341
\.


--
-- Data for Name: card_templates; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.card_templates (id, name, description, "thumbnailUrl", "backgroundImages", width, height, config, status, "authorId", "createdAt", "updatedAt") FROM stdin;
cmojh0qdo000jiv6e2kyux5vg	신년 카드 템플릿	\N	http://127.0.0.1:19000/posts/card-thumbnails/cmojh0qdo000jiv6e2kyux5vg_1777431831224.jpg	[{"url": "http://127.0.0.1:19000/posts/posts/card/card_bg_1777431829784_card_template1_1777431830920_g2ydwx0u6te.png", "width": 1080, "height": 1920}]	1080	1920	{"logoArea": {"x": 21, "y": 82, "align": "center", "width": 200, "height": 80, "imageUrl": null, "placeholder": "로고 또는 서명"}, "textElements": [{"x": 50, "y": 35, "id": "title", "color": "#4936d3", "label": "제목", "width": 80, "editable": true, "fontSize": 107, "multiline": false, "textAlign": "center", "fontWeight": "bold", "defaultValue": "근하신년", "verticalAlign": "middle"}, {"x": 50, "y": 43, "id": "subtitle", "color": "#5773ff", "label": "부제목", "width": 80, "editable": true, "fontSize": 36, "multiline": false, "textAlign": "center", "fontWeight": "medium", "defaultValue": "새해 복 많이 받으세요.", "verticalAlign": "middle"}, {"x": 50, "y": 52, "id": "greeting", "color": "#333333", "label": "인사말", "width": 75, "editable": true, "fontSize": 37, "multiline": true, "textAlign": "center", "fontWeight": "normal", "defaultValue": "병오년 붉은 말의 해를 맞이하여, 새해에도 귀사에\\n건강과 활력이 가득하시길 바랍니다.\\n지난 한 해 보내주신 신뢰와 성원에 깊이 감사드립니다.", "verticalAlign": "top"}, {"x": 84, "y": 82, "id": "senderName", "color": "#000000", "label": "발신자 이름", "width": 60, "editable": true, "fontSize": 34, "multiline": false, "textAlign": "center", "fontWeight": "medium", "defaultValue": "홍길동", "verticalAlign": "middle"}]}	PUBLISHED	cmkdc777200001251hxs59lzx	2026-04-29 03:03:51.178	2026-04-29 03:03:51.232
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.categories (id, name, slug, type, "pageType", config, "parentId", "order", description, "createdAt", "updatedAt") FROM stdin;
cmkdc6d870002flswkvpv0ptt	Penta Design	penta-design	WORK	gallery	\N	\N	1	기 제작된 디자인 산출물	2026-01-14 01:22:49.592	2026-04-07 08:04:48.922
cmnh2f7jz0003t0cy0mh55m80	디자인 의뢰	design-request	WORK	design-request	\N	\N	2	디자인 의뢰 게시판	2026-04-02 05:59:57.695	2026-04-07 08:04:49.009
cmkdc6d920003flsw95vfyr5s	CI/BI	ci-bi	SOURCE	ci-bi	{"allowedTypes": ["CI", "BI"]}	\N	1	CI/BI 벡터 이미지	2026-01-14 01:22:49.623	2026-04-07 08:04:49.158
cmkdc6d9y0004flswzyhbpe3u	ICON	icon	SOURCE	icon	\N	\N	2	아이콘 벡터 이미지	2026-01-14 01:22:49.654	2026-04-07 08:04:49.227
cmkdc6dat0005flswtjd8rs6z	캐릭터	character	SOURCE	character	\N	\N	3	캐릭터 벡터 이미지	2026-01-14 01:22:49.685	2026-04-07 08:04:49.288
cmkdc6dbn0006flswcuul5400	다이어그램	diagram	SOURCE	\N	\N	\N	4	다이어그램 벡터 이미지	2026-01-14 01:22:49.715	2026-04-07 08:04:49.348
cmkdc6de80009flswx73d5jqy	바탕화면	wallpaper	TEMPLATE	desktop	\N	\N	2	바탕화면 템플릿	2026-01-14 01:22:49.808	2026-04-07 08:04:49.481
cmkdc6df2000aflsw2zyg8umg	웰컴보드	welcome-board	TEMPLATE	welcomeboard	\N	\N	3	웰컴보드 템플릿	2026-01-14 01:22:49.839	2026-04-07 08:04:49.542
cmkdc6ddb0008flsw3460bfbc	감사/연말 카드	card	TEMPLATE	card	\N	\N	4	감사/연말 카드 템플릿	2026-01-14 01:22:49.775	2026-04-07 08:04:49.693
cmlisknxs000boh0omwnb198w	eDM Code Generator	edm	TEMPLATE	edm	{"guideVideoUrl": "https://assets.layerary.com/categories/edm/guide-video/1770860522601-eDM_Generator_Guide_1770860522601_tolfea8gnq.mp4", "guideVideoFileName": "eDM_Generator_Guide.mp4", "guideVideoFileSize": 38353653}	\N	5	eDM HTML 코드 생성	2026-02-12 01:40:23.729	2026-04-07 08:04:49.756
cmkdc6dfw000bflsw1kajwbt2	WAPPLES	wapples	BROCHURE	wapples	\N	\N	1	WAPPLES 제품 브로셔	2026-01-14 01:22:49.868	2026-04-07 08:04:49.825
cmkdc6dgp000cflsw1k2j57jt	D.AMO	damo	BROCHURE	damo	\N	\N	2	D.AMO 제품 브로셔	2026-01-14 01:22:49.897	2026-04-07 08:04:49.886
cmkdc6dhi000dflswuzi033eb	iSIGN	isign	BROCHURE	isign	\N	\N	3	iSIGN 제품 브로셔	2026-01-14 01:22:49.926	2026-04-07 08:04:50.066
cmkdc6dif000eflswndtrdztu	Cloudbric	cloudbric	BROCHURE	cloudbric	\N	\N	4	Cloudbric 제품 브로셔	2026-01-14 01:22:49.959	2026-04-07 08:04:50.224
cmkdc6dch0007flswqgemr713	PPT	ppt	TEMPLATE	ppt	{"zipFileUrl": "http://127.0.0.1:19000/posts/categories/ppt/zip/1777428760817-font_Pretendard_1777428760817_ugjju38s75d.zip", "zipFileName": "font_Pretendard.zip", "zipFileSize": 9400708}	\N	1	PPT 템플릿	2026-01-14 01:22:49.746	2026-04-29 02:12:41.082
\.


--
-- Data for Name: design_requests; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.design_requests (id, title, content, "departmentTeam", "dueDate", status, "authorId", "createdAt", "updatedAt") FROM stdin;
cmnybwayy0001e81ljtxgoylo	펜타 임직원 여러분, 환영합니다.	많은 관심과 적극적인 활용을 부탁드립니다.	디자인팀	2026-04-15	IN_PROGRESS	cmkw65m0400007y0ic9c0hnjk	2026-04-14 07:57:16.807	2026-04-28 23:35:08.448
cmojb88it0001137n2q0wpcqn	디자인의뢰 이메일 알림 테스트	<p><span style="font-size: 16px;"><strong>이메일 알림 기능 </strong></span><br></p><p>디자인 의뢰시 <span style="color: rgb(0, 51, 255);">이메일 알림이</span> 가는지 <strong>테스트</strong>합니다.</p><p data-indent="1" style="margin-left: 1.5em;">- 아주 잘 되고 있어요</p><p data-indent="1" style="margin-left: 1.5em;">- 다음에 도 잘되었으면 합니다.</p>	기획실 디자인팀	2026-05-13	REQUESTED	cmkdc777200001251hxs59lzx	2026-04-29 00:21:43.586	2026-04-30 01:45:36.97
cmokvj0sc0001d70gfd603zt5	사내망 이전 작업 요청	<p><span style="color: rgb(50, 42, 206); font-size: 18px;"><strong>사내망 이전 작업 내용</strong></span></p><p></p><p><span style="font-size: 16px;"><strong>완료 작업 </strong></span></p><p data-indent="1" style="margin-left: 1.5em;">1. DB &amp; Storage 백업 자동화 구현 </p><p data-indent="1" style="margin-left: 1.5em;">2. Design5 서비스 기능(추가, 수정, 삭제 등) 검증 완료</p><p data-indent="1" style="margin-left: 1.5em;">3. 디자인 의뢰 게시판 내용 편집기능 추가</p><p></p><p><span style="font-size: 16px;"><strong>남은 작업 </strong></span></p><p data-indent="1" style="margin-left: 1.5em;">1. 도메인 / 인증서 준비</p><p data-indent="1" style="margin-left: 1.5em;">2. 환경변수에서 도메인 값 반영</p><p data-indent="1" style="margin-left: 1.5em;">3. db 에서 기존 외부 서비스 URL 치환하기 </p><p data-indent="1" style="margin-left: 1.5em;">4. 변경된 도메인으로 웹서비스 기능 테스트</p><p data-indent="1" style="margin-left: 1.5em;">5. 보안 및 운영 점검하기 </p>	기획실 디자인팀	2026-05-05	REQUESTED	cmkdc777200001251hxs59lzx	2026-04-30 02:37:45.261	2026-04-30 02:37:45.261
\.


--
-- Data for Name: desktop_wallpapers; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.desktop_wallpapers (id, title, description, "thumbnailUrl", "backgroundUrlWindows", "backgroundUrlMac", "widthWindows", "heightWindows", "widthMac", "heightMac", "authorId", "createdAt", "updatedAt") FROM stdin;
cmojfldrs000biv6euqnj6cgt	비전 태그 배경	TRUST FOR OPEN SOCIETY 태그 포함	http://127.0.0.1:19000/posts/wallpaper/thumbnails/thumb_1777429435336_1777429435376.jpg	http://127.0.0.1:19000/posts/posts/wallpaper/wallpaper_win_1777429434644_Line_1777429435132_yiwjsvypohf.jpg	\N	2560	1440	2560	1600	cmkdc777200001251hxs59lzx	2026-04-29 02:23:55.383	2026-04-29 02:30:53.953
cmojfvnag000div6ec5fh8gbq	빌딩	아래에서 위로 쳐다보는 빌딩 배경	http://127.0.0.1:19000/posts/wallpaper/thumbnails/thumb_1777429914222_1777429914271.jpg	\N	http://127.0.0.1:19000/posts/posts/wallpaper/wallpaper_mac_1777429912983_Building_1777429914136_0w5h3u81p3pb.jpg	2560	1440	2560	1600	cmkdc777200001251hxs59lzx	2026-04-29 02:31:54.279	2026-04-29 02:31:54.279
\.


--
-- Data for Name: diagram_zip_config; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.diagram_zip_config (id, key, "zipFileUrl", "zipFileName", "zipFileSize", "updatedAt") FROM stdin;
cml04oytj0000v05nxuz1qgxi	default	https://assets.layerary.com/diagrams/zip/1769733338646-______________________1769733338645_kobpodikqjf.zip	다이어그램 템플릿.zip	2008006	2026-02-26 01:41:42.014
\.


--
-- Data for Name: diagrams; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.diagrams (id, title, description, "thumbnailUrl", "canvasData", width, height, "authorId", "createdAt", "updatedAt") FROM stdin;
cml0flpnq00016e1vlplwtkw8	테스트 다이어그램	\N	https://assets.layerary.com/diagrams/thumbnails/diagram_1769750244501.png	[{"x": 460.5854483980809, "y": 416.585448398081, "id": "shape_1769750224584_e6vao7fck", "fill": "#3b82f6", "type": "rect", "width": 358.5448398081028, "height": 358.5448398081028, "stroke": "#1e40af", "rotation": 0, "strokeWidth": 2}, {"x": 756.1208209273009, "y": 224.1208209273016, "id": "shape_1769750229132_gf6ypw1l7", "fill": "#10b981", "type": "circle", "radius": 156.0410463650874, "stroke": "#059669", "rotation": 0, "strokeWidth": 2}]	1920	1080	cmkdc6d6s0001flsw5ta5eihq	2026-01-30 05:17:26.435	2026-02-26 01:41:41.713
cml0fmtkc00036e1v8lnooibw	관리자 다이어그램	\N	https://assets.layerary.com/diagrams/thumbnails/diagram_1769750296500.png	[{"x": 577.1189775519956, "y": 449.0220436178264, "id": "shape_1769750278032_rdgmt1ttn", "fill": "#3b82f6", "type": "pentagon", "sides": 5, "radius": 170.6098466841435, "stroke": "#1e40af", "rotation": 0, "strokeWidth": 2}, {"x": 1381.457159391534, "y": 511.4571593915334, "id": "shape_1769750282581_cj3jl20ei", "fill": "#4ff53b", "type": "star", "stroke": "#1e40af", "rotation": 0, "numPoints": 5, "innerRadius": 62.92437623197385, "outerRadius": 157.3109405799346, "strokeWidth": 2}]	1920	1080	cmkdc777200001251hxs59lzx	2026-01-30 05:18:18.154	2026-02-26 01:41:41.756
cmmo6ksdd00091vcayker1ucm	제목 없는 다이어그램	\N	https://assets.layerary.com/diagrams/thumbnails/diagram_1773363056323.png	[{"x": 199.9703897577052, "y": 336.9703897577048, "id": "shape_1773363048226_d415ggysi", "fill": "#3b82f6", "type": "rect", "width": 402.9996141012828, "height": 402.9996141012827, "stroke": "#1e40af", "rotation": 0, "strokeWidth": 2}]	1920	1080	cmkw65m0400007y0ic9c0hnjk	2026-03-13 00:50:57.312	2026-03-13 00:50:57.312
\.


--
-- Data for Name: edms; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.edms (id, title, description, "thumbnailUrl", "imageWidth", "imageHeight", "gridConfig", "cellLinks", "cellImages", "htmlCode", alignment, "authorId", "createdAt", "updatedAt") FROM stdin;
cmojj5tjf000514ole0eywqru	2026 펜타 D.AMO 프로모션 eDM	프로모션 홍보용	http://127.0.0.1:19000/edms/1777435427599/thumbnail.jpg	900	2296	{"cols": [0, 27.33333333333333, 72.44444444444444, 100], "rows": [0, 59.27700348432056, 64.15505226480836, 100], "mergedCells": [{"colSpan": 3, "rowSpan": 1, "primaryId": "1-1"}, {"colSpan": 3, "rowSpan": 1, "primaryId": "3-1"}]}	{"2-2": "https://www.google.com"}	{"1-1": "http://127.0.0.1:19000/edms/1777435427599/cell_1-1_900x1361.jpg", "2-1": "http://127.0.0.1:19000/edms/1777435427599/cell_2-1_246x112.jpg", "2-2": "http://127.0.0.1:19000/edms/1777435427599/cell_2-2_406x112.jpg", "2-3": "http://127.0.0.1:19000/edms/1777435427599/cell_2-3_248x112.jpg", "3-1": "http://127.0.0.1:19000/edms/1777435427599/cell_3-1_900x823.jpg"}	<table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; max-width: 900px; min-width: 320px; border-collapse: collapse; border-spacing: 0; padding: 0; table-layout: fixed">\n  <colgroup>\n    <col style="width: 27.333333333333332%;" />\n    <col style="width: 45.111111111111114%;" />\n    <col style="width: 27.555555555555557%;" />\n  </colgroup>\n  <tr>\n    <td colspan="3" style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/1777435427599/cell_1-1_900x1361.jpg" alt="Cell 1-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n  <tr>\n    <td style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/1777435427599/cell_2-1_246x112.jpg" alt="Cell 2-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n    <td style="padding: 0; vertical-align: top; border: none"><a href="https://www.google.com" target="_blank" style="display:block;"><img src="http://127.0.0.1:19000/edms/1777435427599/cell_2-2_406x112.jpg" alt="Cell 2-2" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></a></td>\n    <td style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/1777435427599/cell_2-3_248x112.jpg" alt="Cell 2-3" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n  <tr>\n    <td colspan="3" style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/1777435427599/cell_3-1_900x823.jpg" alt="Cell 3-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n</table>	left	cmkdc6d6s0001flsw5ta5eihq	2026-04-29 04:03:47.786	2026-04-29 04:03:47.786
cmojix1nf000114olnr9xff6f	키관리 eDM	D.AMO KMS 홍보	http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/thumbnail.jpg	900	3603	{"cols": [0, 15.55555555555556, 47.33333333333334, 52.44444444444445, 84.66666666666667, 100], "rows": [0, 28.14321398834305, 47.01637524285317, 72.27310574521232, 93.64418540105468, 95.97557590896474, 100], "mergedCells": [{"colSpan": 5, "rowSpan": 1, "primaryId": "1-1"}, {"colSpan": 5, "rowSpan": 1, "primaryId": "2-1"}, {"colSpan": 5, "rowSpan": 1, "primaryId": "3-1"}, {"colSpan": 5, "rowSpan": 1, "primaryId": "4-1"}, {"colSpan": 5, "rowSpan": 1, "primaryId": "6-1"}]}	{"5-2": "https://www.google.com", "5-4": "https://www.naver.com"}	{"1-1": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_1-1_900x1014.jpg", "2-1": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_2-1_900x680.jpg", "3-1": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_3-1_900x910.jpg", "4-1": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_4-1_900x770.jpg", "5-1": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-1_140x84.jpg", "5-2": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-2_286x84.jpg", "5-3": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-3_46x84.jpg", "5-4": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-4_290x84.jpg", "5-5": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-5_138x84.jpg", "6-1": "http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_6-1_900x145.jpg"}	<table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; max-width: 900px; min-width: 320px; border-collapse: collapse; border-spacing: 0; padding: 0; table-layout: fixed">\n  <colgroup>\n    <col style="width: 15.55555555555556%;" />\n    <col style="width: 31.777777777777782%;" />\n    <col style="width: 5.111111111111107%;" />\n    <col style="width: 32.22222222222222%;" />\n    <col style="width: 15.333333333333329%;" />\n  </colgroup>\n  <tr>\n    <td colspan="5" style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_1-1_900x1014.jpg" alt="Cell 1-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n  <tr>\n    <td colspan="5" style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_2-1_900x680.jpg" alt="Cell 2-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n  <tr>\n    <td colspan="5" style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_3-1_900x910.jpg" alt="Cell 3-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n  <tr>\n    <td colspan="5" style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_4-1_900x770.jpg" alt="Cell 4-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n  <tr>\n    <td style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-1_140x84.jpg" alt="Cell 5-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n    <td style="padding: 0; vertical-align: top; border: none"><a href="https://www.google.com" target="_blank" style="display:block;"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-2_286x84.jpg" alt="Cell 5-2" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></a></td>\n    <td style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-3_46x84.jpg" alt="Cell 5-3" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n    <td style="padding: 0; vertical-align: top; border: none"><a href="https://www.naver.com" target="_blank" style="display:block;"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-4_290x84.jpg" alt="Cell 5-4" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></a></td>\n    <td style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_5-5_138x84.jpg" alt="Cell 5-5" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n  <tr>\n    <td colspan="5" style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/cmojix1nf000114olnr9xff6f_1777435625828/cell_6-1_900x145.jpg" alt="Cell 6-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n</table>	left	cmkdc6d6s0001flsw5ta5eihq	2026-04-29 03:56:58.381	2026-04-29 04:07:06.281
cmokqt4sm000110byppej959z	파트너 초청데이 eDM	파트너 행성	http://127.0.0.1:19000/edms/1777508738721/thumbnail.jpg	800	1920	{"cols": [0, 33.33, 66.66, 100], "rows": [0, 32.08333333333334, 95, 100], "mergedCells": [{"colSpan": 3, "rowSpan": 1, "primaryId": "1-1"}, {"colSpan": 3, "rowSpan": 1, "primaryId": "2-1"}]}	{"3-2": "https://www.pentasecurity.co.kr"}	{"1-1": "http://127.0.0.1:19000/edms/1777508738721/cell_1-1_800x616.jpg", "2-1": "http://127.0.0.1:19000/edms/1777508738721/cell_2-1_800x1208.jpg", "3-1": "http://127.0.0.1:19000/edms/1777508738721/cell_3-1_267x96.jpg", "3-2": "http://127.0.0.1:19000/edms/1777508738721/cell_3-2_267x96.jpg", "3-3": "http://127.0.0.1:19000/edms/1777508738721/cell_3-3_267x96.jpg"}	<table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; max-width: 800px; min-width: 320px; border-collapse: collapse; border-spacing: 0; padding: 0; table-layout: fixed">\n  <colgroup>\n    <col style="width: 33.33%;" />\n    <col style="width: 33.33%;" />\n    <col style="width: 33.34%;" />\n  </colgroup>\n  <tr>\n    <td colspan="3" style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/1777508738721/cell_1-1_800x616.jpg" alt="Cell 1-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n  <tr>\n    <td colspan="3" style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/1777508738721/cell_2-1_800x1208.jpg" alt="Cell 2-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n  <tr>\n    <td style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/1777508738721/cell_3-1_267x96.jpg" alt="Cell 3-1" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n    <td style="padding: 0; vertical-align: top; border: none"><a href="https://www.pentasecurity.co.kr" target="_blank" style="display:block;"><img src="http://127.0.0.1:19000/edms/1777508738721/cell_3-2_267x96.jpg" alt="Cell 3-2" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></a></td>\n    <td style="padding: 0; vertical-align: top; border: none"><img src="http://127.0.0.1:19000/edms/1777508738721/cell_3-3_267x96.jpg" alt="Cell 3-3" style="display: block; width: 100%; max-width: 100%; height: auto; border: none" /></td>\n  </tr>\n</table>	left	cmkdc777200001251hxs59lzx	2026-04-30 00:25:38.939	2026-04-30 00:25:38.939
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.notices (id, title, content, "isImportant", "viewCount", attachments, "authorId", "createdAt", "updatedAt") FROM stdin;
cmkeldsna0001qsljomygineu	캐릭터 페이지 제작	이제 캐릭터 페이지에서 원하는 캐릭터 이미지를 선택한 후 \n우측 속성패널에서 사이즈 변경하여 원하는 이미지 포맷으로 다운로드 가능합니다.	f	0	null	cmkdc777200001251hxs59lzx	2026-01-14 22:28:18.881	2026-01-14 22:28:18.881
cmkg6ysr60001deyqiloj8bjy	이미지 로딩 개선 처리	Next.js Image 컴포넌트 사용\nSkeletone UI 적용 ( blur Placeholder 및 썸네일 방식 포함 )\n일부 브라우저 캐싱 사용 	f	2	null	cmkdc777200001251hxs59lzx	2026-01-16 01:20:16.906	2026-01-16 01:20:32.765
cmknldxr7000167mxxistxzqw	PDF Extractor 페이지 제작	PDF 파일에서 원하는 페이지만을 추출해서 새로운 파일로 다운로드 해주는 기능	f	2	null	cmkdc777200001251hxs59lzx	2026-01-21 05:38:21.084	2026-01-22 01:10:06.085
cmkp159le0001dtbixx49szlv	ICON 페이지 제작	아이콘을 선택하고 선두께, 색상, 크기 등 조절 후 다운로드 가능	f	2	null	cmkdc777200001251hxs59lzx	2026-01-22 05:47:16.38	2026-01-26 05:58:09.604
cmkurae3t0001p47s4ad6m45z	Chart Generator 페이지 제작	다양한 차트 타입을 선택하고 데이터를 입력해서 \n원하는 차트를 만들고 이미지 또는 PPT 로 저장할 수 있어요.	f	4	null	cmkdc777200001251hxs59lzx	2026-01-26 05:57:56.404	2026-01-26 05:58:47.902
cmkw6fygt00015wvi8m7gkqku	웰컴보드 페이지 작업 중	사용자가 선택한 템프릿에서 정해진 요소의 내용을 수정한 후 \n바로 이미지 또는 PDF 파일로 다운로드 할 수 있는 서비스입니다.\n작업 중이예요~~	f	6	null	cmkdc777200001251hxs59lzx	2026-01-27 05:49:56.498	2026-02-11 05:56:41.65
\.


--
-- Data for Name: post_tags; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.post_tags (id, "postId", "tagId") FROM stdin;
cmkdfomi9001513vedjcuzolo	cmkdfomi9001313vefmb2ai3r	cmkdfmuuy000t13ve1xfc978l
cmkdfp66s001913vemnjakunl	cmkdfp66s001713ve4js3m2j6	cmkdfmuuy000t13ve1xfc978l
cmkdfpz06001d13veets4q0fj	cmkdfpz06001b13veksr4p5sp	cmkdfmuuy000t13ve1xfc978l
cmkdfqg5u001h13ve1nh98pui	cmkdfqg5u001f13ve1kc7bo2y	cmkdfmuuy000t13ve1xfc978l
cmkdfqy09001l13veuh44holw	cmkdfqy09001j13vek2s3njeu	cmkdfmuuy000t13ve1xfc978l
cmkdfrbi4001p13veyz1yb0md	cmkdfrbi4001n13vek2unczb2	cmkdfmuuy000t13ve1xfc978l
cmkdfrrab001t13ve1uiursv0	cmkdfrrab001r13vexqiz8d3j	cmkdfmuuy000t13ve1xfc978l
cmkdfsgry001x13veywswzv52	cmkdfsgry001v13veu2qg1z2t	cmkdfmuuy000t13ve1xfc978l
cmkdftaf2002113vesow5ufye	cmkdftaf2001z13ve0y10o18g	cmkdfmuuy000t13ve1xfc978l
cmkdftoos002513velbyerdmx	cmkdftoos002313vepmzaparx	cmkdfmuuy000t13ve1xfc978l
cmkdfu542002913veumf9cpun	cmkdfu542002713ve4ef8q9tl	cmkdfmuuy000t13ve1xfc978l
cmkdfui7y002d13vez2pvl1xu	cmkdfui7y002b13ve5i1w7ou4	cmkdfmuuy000t13ve1xfc978l
cmkdfuyv4002h13ve6p0ojq9b	cmkdfuyv4002f13vepp53cupt	cmkdfmuuy000t13ve1xfc978l
cmkdfw4ws002m13ve2si54e3w	cmkdfw4ws002k13vecnswrflf	cmkdfw4w2002i13veva03ukk3
cmkdfws00002q13ve5pxuhv00	cmkdfws00002o13ve5iq0eohg	cmkdfw4w2002i13veva03ukk3
cmkdfx9o9002u13ve9sh8fw9m	cmkdfx9o8002s13ve94djclhw	cmkdfw4w2002i13veva03ukk3
cmkdfxwvu002y13veosn8bwsr	cmkdfxwvu002w13ve14ztbpjd	cmkdfw4w2002i13veva03ukk3
cmkdfydvw003213verltojuw8	cmkdfydvw003013vejiuooc42	cmkdfw4w2002i13veva03ukk3
cmkdfyvzb003613vek9uoty6z	cmkdfyvzb003413vetljo3jfp	cmkdfw4w2002i13veva03ukk3
cmkdfzbxc003a13vedxa7bq5j	cmkdfzbxc003813vebc729nxf	cmkdfw4w2002i13veva03ukk3
cmkdfztwu003e13veky0glkm6	cmkdfztwu003c13velhgepz0e	cmkdfw4w2002i13veva03ukk3
cmkdg1bsf003i13ve4cqki0kh	cmkdg1bsf003g13veb3bzvi72	cmkdfw4w2002i13veva03ukk3
cmkdg1w5d003m13vexubmbbaf	cmkdg1w5d003k13vexo9ve8br	cmkdfw4w2002i13veva03ukk3
cmkdg2g91003q13vem41d9t3t	cmkdg2g91003o13ve77oea698	cmkdfw4w2002i13veva03ukk3
cmkdg30sp003u13vej7eqgvnf	cmkdg30sp003s13vejcyzz2y6	cmkdfw4w2002i13veva03ukk3
cmkdg493k003z13vexyfedh1v	cmkdg493k003x13vesxuuy2bm	cmkdg492o003v13ve8eativm6
cmkdg4u5g004313verfnmy9it	cmkdg4u5g004113veeg0y4rlz	cmkdg492o003v13ve8eativm6
cmkdg5u5f004713vewls1lg83	cmkdg5u5f004513veaqujpinl	cmkdg492o003v13ve8eativm6
cmkdg6frr004b13vecyk75nq2	cmkdg6frr004913veo4dtcsq9	cmkdg492o003v13ve8eativm6
cmkdg6wsz004f13veazmen3wh	cmkdg6wsz004d13ve9cnpulot	cmkdg492o003v13ve8eativm6
cmkdg7ag8004j13vebfyva3z2	cmkdg7ag8004h13vey1g78bt1	cmkdg492o003v13ve8eativm6
cmkdg7mpw004n13vez3wan2yi	cmkdg7mpw004l13ve8pxq8ifj	cmkdg492o003v13ve8eativm6
cmkdg8515004r13ve95si4v7e	cmkdg8515004p13veqqqfduw9	cmkdg492o003v13ve8eativm6
cmkdg8nvz004v13ve63bmnw1m	cmkdg8nvz004t13ve7yj2tcpb	cmkdg492o003v13ve8eativm6
cmkdg9m9a005013ve66j7h4wb	cmkdg9m9a004y13vexa1e86vy	cmkdg9m8j004w13vesjmqlumx
cmkdga243005413vem6ymu0ns	cmkdga243005213vepprn7ybi	cmkdg9m8j004w13vesjmqlumx
cmkdgafwd005813vetn4di62t	cmkdgafwd005613vewzpasm1w	cmkdg9m8j004w13vesjmqlumx
cmkdgbbo0005d13ve2do3wsjw	cmkdgbbo0005b13vecfvi1zqp	cmkdgbbnc005913ve2u0zdre3
cmkdgbvl4005h13vet33nyh5i	cmkdgbvl4005f13ve7jx7ri2p	cmkdgbbnc005913ve2u0zdre3
cmkdgc87i005l13ven3ucoxpq	cmkdgc87i005j13ve2b87o5kd	cmkdgbbnc005913ve2u0zdre3
cmkdgcoe9005p13veehvharzm	cmkdgcoe9005n13ve5fr580zg	cmkdgbbnc005913ve2u0zdre3
cmkdgd60g005t13vevhj6okux	cmkdgd60g005r13ve72rc1ss3	cmkdgbbnc005913ve2u0zdre3
cmkdgdn78005x13veahokbwn1	cmkdgdn78005v13venotndii1	cmkdgbbnc005913ve2u0zdre3
cmkdge230006113ve7ee6mx8s	cmkdge230005z13vei0kj41re	cmkdgbbnc005913ve2u0zdre3
cmkdhthr50003nvumpl5r4iql	cmkdhthr50001nvum8xs0jssk	cmkdgbbnc005913ve2u0zdre3
cmojc8gnj000d137n7meo0lb7	cmojc8gnj000b137ncdbcqb4d	cmkdfmuuy000t13ve1xfc978l
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.posts (id, title, subtitle, description, "thumbnailUrl", "fileUrl", images, "fileSize", "fileType", "mimeType", "categoryId", status, "isEditable", "viewCount", "downloadCount", concept, tool, "producedAt", "authorId", "updatedById", "createdAt", "updatedAt") FROM stdin;
cmn5l9l4v0003d10scttgjrfg	와플 20주년	행사 디자인	\N	https://design5.pentasecurity.com/posts/penta-design/202502______20______1080x1920_20240410_1774415648468_ely445a0ofu.jpg	http://127.0.0.1:19000/posts/penta-design/202502______20______1080x1920_20240410_1774415648468_ely445a0ofu.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202502______20______1080x1920_20240410_1774415648468_ely445a0ofu.jpg", "name": "202502_와플20주년_1080x1920_20240410.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAsDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDBAb/xAAaEAACAwEBAAAAAAAAAAAAAAAAAQIDIRET/8QAFQEBAQAAAAAAAAAAAAAAAAAABAP/xAAZEQADAAMAAAAAAAAAAAAAAAAAAQIDETH/2gAMAwEAAhEDEQA/AOmlPgnqSsmQdmj1AN5NDWszN6AFp4Go/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202502______20______1080x1920_20240410_1774415648468_ely445a0ofu.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/202502______20______1920x1080_20250410_1774415651258_16liusm8syhi.jpg", "name": "202502_와플20주년_1920x1080_20250410.jpg", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIEAwb/xAAXEAEBAQEAAAAAAAAAAAAAAAAAAQMC/8QAFgEBAQEAAAAAAAAAAAAAAAAABAED/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAECEv/aAAwDAQACEQMRAD8A6rTtP3obSpu6dMhnQ90DC0Nck2z/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202502______20______1920x1080_20250410_1774415651258_16liusm8syhi.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	5	0	\N	\N	2025-02-12 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-25 05:14:13.944	2026-05-19 01:21:21.19
cmlg3oopd0013jlxphtoog5ph	people	\N	\N	https://design5.pentasecurity.com/icons/1770697688457-people.svg	http://127.0.0.1:19000/icons/1770697688457-people.svg	[{"url": "http://127.0.0.1:19000/icons/1770697688457-people.svg", "name": "people.svg", "order": 0}]	895	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:08.589	2026-04-28 03:29:24.699
cmkq1u3l60013sykcg1xrvsx3	yuan	\N	\N	https://design5.pentasecurity.com/icons/1769122461246-yuan.svg	http://127.0.0.1:19000/icons/1769122461246-yuan.svg	[{"url": "http://127.0.0.1:19000/icons/1769122461246-yuan.svg", "name": "yuan.svg", "order": 0}]	774	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:54:21.355	2026-04-28 03:29:24.702
cmkf3k3ah0009r1o2gvxg0gbe	Cloudbric RAS	\N	ZTNA	https://design5.pentasecurity.com/posts/cloudbric/Cloudbric_RAS_1768460223605_kdtebkf1507.pdf	http://127.0.0.1:19000/posts/cloudbric/Cloudbric_RAS_1768460223605_kdtebkf1507.pdf	[{"url": "http://127.0.0.1:19000/posts/cloudbric/Cloudbric_RAS_1768460223605_kdtebkf1507.pdf", "name": "Cloudbric_RAS.pdf", "order": 0}]	0	image	image/*	cmkdc6dif000eflswndtrdztu	PUBLISHED	f	0	0	RAS	KR	2025-07-09 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:57:05.699	2026-04-28 03:29:24.704
cmkx7771l0001ioodw8ifyeh2	clock	\N	\N	https://design5.pentasecurity.com/icons/1769554733328-clock.svg	http://127.0.0.1:19000/icons/1769554733328-clock.svg	[{"url": "http://127.0.0.1:19000/icons/1769554733328-clock.svg", "name": "clock.svg", "order": 0}]	853	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-27 22:58:53.666	2026-04-28 03:29:24.694
cmkdfqg5u001f13ve1kc7bo2y	D.AMO DA	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_DA_b_1768359742703_jzuec9wi1u.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_DA_b_1768359742703_jzuec9wi1u.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_DA_b_1768359742703_jzuec9wi1u.svg", "name": "D.AMO DA_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMsIprC53IAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAaSURBVHicY2CAA0YGRijAJoYkiCSMLATXDgAFkQAl8bWHiwAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_DA_b_1768359742703_jzuec9wi1u.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:02:25.362	2026-04-28 03:29:24.728
cmkdfsgry001v13veu2qg1z2t	D.AMO Control Center-SC	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_Control_Center_SC_b_1768359836743_rxlv5icv5e.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_Control_Center_SC_b_1768359836743_rxlv5icv5e.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_Control_Center_SC_b_1768359836743_rxlv5icv5e.svg", "name": "D.AMO Control Center-SC_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMzPkOZtaMAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAUSURBVHicY2CEAgYQhAGYIEgcBgACOQAWgWei0AAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_Control_Center_SC_b_1768359836743_rxlv5icv5e.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:03:59.47	2026-04-28 03:29:24.752
cmkdfyvzb003413vetljo3jfp	iSIGN PASS APP	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_PASS_APP_b_1768360136528_scqdgwx44nf.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_APP_b_1768360136528_scqdgwx44nf.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_APP_b_1768360136528_scqdgwx44nf.svg", "name": "iSIGN PASS APP_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMyKK5WMbMAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAWSURBVHicY2BAAYxggCICguiCMDFGAAIfABU0WiCDAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_PASS_APP_b_1768360136528_scqdgwx44nf.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:08:59.112	2026-04-28 03:29:24.771
cmkdg493k003x13vesxuuy2bm	Cloudbric Labs	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Cloudbric_Labs_b_1768360386293_6z6uvu608r7.png	http://127.0.0.1:19000/posts/ci-bi/Cloudbric_Labs_b_1768360386293_6z6uvu608r7.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Cloudbric_Labs_b_1768360386293_6z6uvu608r7.svg", "name": "Cloudbric Labs_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMsJp2vI2sAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2CAA0Y4QIghSaAJQoQBArcAFcX8shAAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Cloudbric_Labs_b_1768360386293_6z6uvu608r7.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:13:09.392	2026-04-28 03:29:24.794
cmkdg9m9a004y13vexa1e86vy	WAPPLES Control Center	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/WAPPLES_Control_Center_b_1768360636633_yw3z4lz925n.png	http://127.0.0.1:19000/posts/ci-bi/WAPPLES_Control_Center_b_1768360636633_yw3z4lz925n.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/WAPPLES_Control_Center_b_1768360636633_yw3z4lz925n.svg", "name": "WAPPLES Control Center_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM0O3yy1+sAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAASSURBVHicY2BEAgwwgCwGEwYAAogAGhBGAKEAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/WAPPLES_Control_Center_b_1768360636633_yw3z4lz925n.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:17:19.727	2026-04-28 03:29:24.816
cmlh9qvrx000be6b0sglkk28a	meter	\N	\N	https://design5.pentasecurity.com/icons/1770768334842-meter.svg	http://127.0.0.1:19000/icons/1770768334842-meter.svg	[{"url": "http://127.0.0.1:19000/icons/1770768334842-meter.svg", "name": "meter.svg", "order": 0}]	1047	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:05:34.941	2026-04-28 03:29:25.381
cmkdgdn78005v13venotndii1	Penta Smart Factory Security	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Penta_Smart_Factory_Security_b_1768360824975_0r41q7xhwhkd.png	http://127.0.0.1:19000/posts/ci-bi/Penta_Smart_Factory_Security_b_1768360824975_0r41q7xhwhkd.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Penta_Smart_Factory_Security_b_1768360824975_0r41q7xhwhkd.svg", "name": "Penta Smart Factory Security_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM7NGuV1rUAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAATSURBVHicY2BAAEYYQIiAIFQQAAFOABQT17SOAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Penta_Smart_Factory_Security_b_1768360824975_0r41q7xhwhkd.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:20:27.573	2026-04-28 03:29:24.833
cmkdhvze10009nvumv8lmzts5	Penta Security CI - Identity	\N	\N	https://design5.pentasecurity.com/posts/ci-bi/penta_ci_identity_1768363359505_fnag4i4ba27.svg	http://127.0.0.1:19000/posts/ci-bi/penta_ci_identity_1768363359505_fnag4i4ba27.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/penta_ci_identity_1768363359505_fnag4i4ba27.svg", "name": "penta_ci_identity.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAACVBMVEVZfp04cqIfaaSU8D4AAAAAA3RSTlMkNEAIxJiFAAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAIklEQVR4nGNgggJGMGCAAGxiEEGIECMDA1QYLAYRhQkxAAAPAgBOTwJfYQAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/penta_ci_identity_1768363359505_fnag4i4ba27.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	CI	\N	\N	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-14 04:02:42.789	2026-04-28 03:29:24.839
cmkq1s2uc000bsykcnn1mqpw9	bitcoin	\N	\N	https://design5.pentasecurity.com/icons/1769122366897-bitcoin.svg	http://127.0.0.1:19000/icons/1769122366897-bitcoin.svg	[{"url": "http://127.0.0.1:19000/icons/1769122366897-bitcoin.svg", "name": "bitcoin.svg", "order": 0}]	832	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:52:47.077	2026-04-28 03:29:24.841
cmkq1nhub0009sykcdx3gl193	atm	\N	\N	https://design5.pentasecurity.com/icons/1769122153099-atm.svg	http://127.0.0.1:19000/icons/1769122153099-atm.svg	[{"url": "http://127.0.0.1:19000/icons/1769122153099-atm.svg", "name": "atm.svg", "order": 0}]	895	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:49:13.228	2026-04-28 03:29:24.855
cmkq1s30d000dsykcmjp4ll7q	calculator	\N	\N	https://design5.pentasecurity.com/icons/1769122367154-calculator.svg	http://127.0.0.1:19000/icons/1769122367154-calculator.svg	[{"url": "http://127.0.0.1:19000/icons/1769122367154-calculator.svg", "name": "calculator.svg", "order": 0}]	1201	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:52:47.293	2026-04-28 03:29:24.857
cmlhbtdz30007pw060384820v	battery-car	\N	\N	https://design5.pentasecurity.com/icons/1770771810952-battery-car.svg	http://127.0.0.1:19000/icons/1770771810952-battery-car.svg	[{"url": "http://127.0.0.1:19000/icons/1770771810952-battery-car.svg", "name": "battery-car.svg", "order": 0}]	756	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:31.071	2026-04-28 03:29:25.418
cmlhbvm4w001vpw06mo33vl9v	taxi	\N	\N	https://design5.pentasecurity.com/icons/1770771914836-taxi.svg	http://127.0.0.1:19000/icons/1770771914836-taxi.svg	[{"url": "http://127.0.0.1:19000/icons/1770771914836-taxi.svg", "name": "taxi.svg", "order": 0}]	1500	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:05:14.96	2026-04-28 03:29:25.481
cmkdpjwbg0009utpiju458iky	출입카드	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______1_1768376232763_wphsn8vurx.png	http://127.0.0.1:19000/posts/character/_______1_1768376232763_wphsn8vurx.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______1_1768376232763_wphsn8vurx.svg", "name": "인사부1.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAPCAMAAADTRh9nAAAABlBMVEWuxdGbxNjvtG+7AAAAAnRSTlM5SXcXubYAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA3SURBVHicrcxBCgAwCAPBzf8/XVoUouTYHIdV+DShRIuF3lzbnM0uFzoVzrDSSem8OZX7ZSwFBzoHAJIc0wFpAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______1_1768376232763_wphsn8vurx.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인사부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 07:37:15.861	2026-04-28 03:29:24.875
cmkuryeq20007y5pvuaz3imj6	calendar	\N	\N	https://design5.pentasecurity.com/icons/1769408196345-calendar.svg	http://127.0.0.1:19000/icons/1769408196345-calendar.svg	[{"url": "http://127.0.0.1:19000/icons/1769408196345-calendar.svg", "name": "calendar.svg", "order": 0}]	1246	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:16:37.125	2026-04-28 03:29:24.91
cmkem2i4s000vqsljgngelpck	미래사업본부 5	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________5_1768430848773_mggo2dpkiwh.png	http://127.0.0.1:19000/posts/character/______________5_1768430848773_mggo2dpkiwh.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________5_1768430848773_mggo2dpkiwh.svg", "name": "미래사업본부5.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAUCAMAAACzvE1FAAAADFBMVEW8wcaepKpyeX+Ei5DRMK15AAAABHRSTlMtOEM3qFocmAAAAAlwSFlzAAAPYQAAD2EBqD+naQAAAEpJREFUeJy1yksOgFAMQlHg7n/Ppq3Pb+JMGHGC9FcsWz5nrYKhXpORtQ65ghu4XSwwzhIkIK5iYyHSPaJUSLzjQNsD8oah70ddNpAUAYadAsR8AAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________5_1768430848773_mggo2dpkiwh.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	미래보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:47:31.655	2026-04-28 03:29:24.914
cmkus2a9g000by5pvh4tnbwyb	search	\N	\N	https://design5.pentasecurity.com/icons/1769408377582-search.svg	http://127.0.0.1:19000/icons/1769408377582-search.svg	[{"url": "http://127.0.0.1:19000/icons/1769408377582-search.svg", "name": "search.svg", "order": 0}]	668	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:19:37.972	2026-04-28 03:29:24.928
cmkemcrhi001dqslj2b57ieu4	품질관리실 5	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________5_1768431327515_rmjnq3rvzhr.png	http://127.0.0.1:19000/posts/character/______________5_1768431327515_rmjnq3rvzhr.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________5_1768431327515_rmjnq3rvzhr.svg", "name": "품질관리실5.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAPCAMAAADTRh9nAAAABlBMVEXJ0djH0dhAPh9RAAAAAnRSTlNeSV2rRNYAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA8SURBVHictcvBEQAgCAPB0H/TTiQgMPqUly4HLAaAQc9jZOx/7DTWMJngmOLtOC9lofs59V02VDntS7kAW6MAfWxAJOwAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________5_1768431327515_rmjnq3rvzhr.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	품질관리실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:55:30.336	2026-04-28 03:29:24.933
cmkemghzx001rqslj85isrxqw	인사부 4	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______4_1768431501553_v8ntf9tk2g.png	http://127.0.0.1:19000/posts/character/_______4_1768431501553_v8ntf9tk2g.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______4_1768431501553_v8ntf9tk2g.svg", "name": "인사부4.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAANCAMAAACejr5sAAAACVBMVEWCuNWBvduBttLBc97IAAAAA3RSTlNkc1Gt1ux1AAAACXBIWXMAAA9hAAAPYQGoP6dpAAAARklEQVR4nGXOQRIAIAgCQOL/j25ErDQ8tZETgPUGAIiBoR+GBTYtHBvdfFiWz60qFIo1acY8l1GfOqGxRRTNWzYJdXGF5AZotADaM2KlbQAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______4_1768431501553_v8ntf9tk2g.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인사부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:58:24.663	2026-04-28 03:29:24.952
cmkemgty3001tqslj9ms8c23l	인사부 5	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______5_1768431516650_qryvk6p7vgj.png	http://127.0.0.1:19000/posts/character/_______5_1768431516650_qryvk6p7vgj.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______5_1768431516650_qryvk6p7vgj.svg", "name": "인사부5.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAATCAMAAACnUt2HAAAAElBMVEWpt7/Y3+Oyv8fO19zEz9W7x86abxQzAAAABnRSTlMtiD91YlCS0PC3AAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAT0lEQVR4nJXJQRKAMAhDUQjk/ld2QFCmrQs/qzxE/oa8GWayCSDBi2WJBCuwsOF5QFaKEp1e0W/s/UbZzT3QRm6BU7pvVNPKNLHn6Ih6xAuJMAOKXvwXSgAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______5_1768431516650_qryvk6p7vgj.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인사부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:58:40.148	2026-04-28 03:29:24.954
cmkes9hi40001t4xp83tryghc	WAPPLES	\N	WAPPLES 국문 6page	https://design5.pentasecurity.com/posts/wapples/WAPPLES_Brochure_KR_251104_1768441252319_gm2xqjy0qz8.pdf	http://127.0.0.1:19000/posts/wapples/WAPPLES_Brochure_KR_251104_1768441252319_gm2xqjy0qz8.pdf	[{"url": "http://127.0.0.1:19000/posts/wapples/WAPPLES_Brochure_KR_251104_1768441252319_gm2xqjy0qz8.pdf", "name": "WAPPLES_Brochure_KR_251104.pdf", "order": 0}]	0	image	image/*	cmkdc6dfw000bflsw1kajwbt2	PUBLISHED	f	0	0	WAPPLES	KR	2025-11-03 15:00:00	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-15 01:40:55.125	2026-04-28 03:29:24.975
cmkq1s35i000fsykc7chmgfor	card	\N	\N	https://design5.pentasecurity.com/icons/1769122367370-card.svg	http://127.0.0.1:19000/icons/1769122367370-card.svg	[{"url": "http://127.0.0.1:19000/icons/1769122367370-card.svg", "name": "card.svg", "order": 0}]	777	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:52:47.478	2026-04-28 03:29:25.006
cmkq1s3bi000hsykchz3y7kcq	cryptocurrency-wallet	\N	\N	https://design5.pentasecurity.com/icons/1769122367556-cryptocurrency-wallet.svg	http://127.0.0.1:19000/icons/1769122367556-cryptocurrency-wallet.svg	[{"url": "http://127.0.0.1:19000/icons/1769122367556-cryptocurrency-wallet.svg", "name": "cryptocurrency-wallet.svg", "order": 0}]	1184	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:52:47.694	2026-04-28 03:29:25.008
cmkq1s3hd000jsykcp5ugk1to	dollar-note	\N	\N	https://design5.pentasecurity.com/icons/1769122367767-dollar-note.svg	http://127.0.0.1:19000/icons/1769122367767-dollar-note.svg	[{"url": "http://127.0.0.1:19000/icons/1769122367767-dollar-note.svg", "name": "dollar-note.svg", "order": 0}]	1056	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:52:47.906	2026-04-28 03:29:25.01
cmknaq34e000112sus0avghqq	MeiryoUI 일문	\N	v3.1, 16:9	https://design5.pentasecurity.com/ppt-thumbnails/ppt-cmknaq34e000112sus0avghqq-1775720455239.jpg	http://127.0.0.1:19000/posts/ppt/PPT_Template_JP_MeiryoUI_v3_1_1775720451985_m01glyq3jzo.pptx	[{"url": "http://127.0.0.1:19000/posts/ppt/PPT_Template_JP_MeiryoUI_v3_1_1775720451985_m01glyq3jzo.pptx", "name": "PPT_Template_JP_MeiryoUI_v3.1.pptx", "order": 0}]	0	image	image/*	cmkdc6dch0007flswqgemr713	PUBLISHED	f	0	0	가로	JP	2026-04-09 00:00:00	cmkdc777200001251hxs59lzx	cmkw65m0400007y0ic9c0hnjk	2026-01-21 00:39:52.012	2026-04-28 03:29:25.012
cmkqftl0h000f2faodiqsx42j	home-control	\N	\N	https://design5.pentasecurity.com/icons/1769145951553-home-control.svg	http://127.0.0.1:19000/icons/1769145951553-home-control.svg	[{"url": "http://127.0.0.1:19000/icons/1769145951553-home-control.svg", "name": "home-control.svg", "order": 0}]	796	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:25:51.905	2026-04-28 03:29:25.033
cmkq1u2q6000rsykcxael01t4	wallet	\N	\N	https://design5.pentasecurity.com/icons/1769122459822-wallet.svg	http://127.0.0.1:19000/icons/1769122459822-wallet.svg	[{"url": "http://127.0.0.1:19000/icons/1769122459822-wallet.svg", "name": "wallet.svg", "order": 0}]	797	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:54:20.232	2026-04-28 03:29:25.035
cmkq1u36e000xsykcckyeqqi3	yen-note	\N	\N	https://design5.pentasecurity.com/icons/1769122460668-yen-note.svg	http://127.0.0.1:19000/icons/1769122460668-yen-note.svg	[{"url": "http://127.0.0.1:19000/icons/1769122460668-yen-note.svg", "name": "yen-note.svg", "order": 0}]	1028	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:54:20.822	2026-04-28 03:29:25.037
cmkq1u2vm000tsykci5tft6s1	won-note	\N	\N	https://design5.pentasecurity.com/icons/1769122460313-won-note.svg	http://127.0.0.1:19000/icons/1769122460313-won-note.svg	[{"url": "http://127.0.0.1:19000/icons/1769122460313-won-note.svg", "name": "won-note.svg", "order": 0}]	1003	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:54:20.434	2026-04-28 03:29:25.039
cmkq1u30b000vsykc6uvcoxqm	won	\N	\N	https://design5.pentasecurity.com/icons/1769122460494-won.svg	http://127.0.0.1:19000/icons/1769122460494-won.svg	[{"url": "http://127.0.0.1:19000/icons/1769122460494-won.svg", "name": "won.svg", "order": 0}]	682	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:54:20.603	2026-04-28 03:29:25.041
cmkqg1fnh0005ucusjxxxsrd5	smart-medical-treatment	\N	\N	https://design5.pentasecurity.com/icons/1769146317488-smart-medical-treatment.svg	http://127.0.0.1:19000/icons/1769146317488-smart-medical-treatment.svg	[{"url": "http://127.0.0.1:19000/icons/1769146317488-smart-medical-treatment.svg", "name": "smart-medical-treatment.svg", "order": 0}]	943	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:31:58.205	2026-04-28 03:29:25.059
cmkqg1hes0007ucuswso9x42x	syringe	\N	\N	https://design5.pentasecurity.com/icons/1769146320138-syringe.svg	http://127.0.0.1:19000/icons/1769146320138-syringe.svg	[{"url": "http://127.0.0.1:19000/icons/1769146320138-syringe.svg", "name": "syringe.svg", "order": 0}]	995	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:32:00.485	2026-04-28 03:29:25.061
cmkqfse4700032faoapj2zl4w	consent-form	\N	\N	https://design5.pentasecurity.com/icons/1769145895971-consent-form.svg	http://127.0.0.1:19000/icons/1769145895971-consent-form.svg	[{"url": "http://127.0.0.1:19000/icons/1769145895971-consent-form.svg", "name": "consent-form.svg", "order": 0}]	781	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:24:56.311	2026-04-28 03:29:25.088
cmkqfsfwx00052faok8sfoyu6	doctor	\N	\N	https://design5.pentasecurity.com/icons/1769145898333-doctor.svg	http://127.0.0.1:19000/icons/1769145898333-doctor.svg	[{"url": "http://127.0.0.1:19000/icons/1769145898333-doctor.svg", "name": "doctor.svg", "order": 0}]	899	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:24:58.642	2026-04-28 03:29:25.09
cmkqfshqs00072faoa73o4l42	drone-1	\N	\N	https://design5.pentasecurity.com/icons/1769145900658-drone-1.svg	http://127.0.0.1:19000/icons/1769145900658-drone-1.svg	[{"url": "http://127.0.0.1:19000/icons/1769145900658-drone-1.svg", "name": "drone-1.svg", "order": 0}]	1292	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:25:01.012	2026-04-28 03:29:25.092
cmkqfsjk900092faobowcwmqs	drone-2	\N	\N	https://design5.pentasecurity.com/icons/1769145903042-drone-2.svg	http://127.0.0.1:19000/icons/1769145903042-drone-2.svg	[{"url": "http://127.0.0.1:19000/icons/1769145903042-drone-2.svg", "name": "drone-2.svg", "order": 0}]	1377	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:25:03.369	2026-04-28 03:29:25.094
cmkusuucj000py5pvbdrl2gvt	inquiry	\N	\N	https://design5.pentasecurity.com/icons/1769409709439-inquiry.svg	http://127.0.0.1:19000/icons/1769409709439-inquiry.svg	[{"url": "http://127.0.0.1:19000/icons/1769409709439-inquiry.svg", "name": "inquiry.svg", "order": 0}]	669	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:41:50.371	2026-04-28 03:29:25.118
cmkus0bk40009y5pvr4la5cz9	bookmark	\N	\N	https://design5.pentasecurity.com/icons/1769408286097-bookmark.svg	http://127.0.0.1:19000/icons/1769408286097-bookmark.svg	[{"url": "http://127.0.0.1:19000/icons/1769408286097-bookmark.svg", "name": "bookmark.svg", "order": 0}]	940	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:18:06.335	2026-04-28 03:29:25.121
cmkusgez1000fy5pv7q12w07r	battery-discharge	\N	\N	https://design5.pentasecurity.com/icons/1769409036627-battery-discharge.svg	http://127.0.0.1:19000/icons/1769409036627-battery-discharge.svg	[{"url": "http://127.0.0.1:19000/icons/1769409036627-battery-discharge.svg", "name": "battery-discharge.svg", "order": 0}]	716	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:30:37.261	2026-04-28 03:29:25.123
cmkusgf5y000hy5pvkezvn1lw	battery	\N	\N	https://design5.pentasecurity.com/icons/1769409037376-battery.svg	http://127.0.0.1:19000/icons/1769409037376-battery.svg	[{"url": "http://127.0.0.1:19000/icons/1769409037376-battery.svg", "name": "battery.svg", "order": 0}]	594	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:30:37.511	2026-04-28 03:29:25.125
cmlg3nwm5000njlxpoqaxyu0d	folder2	\N	\N	https://design5.pentasecurity.com/icons/1770697651962-folder2.svg	http://127.0.0.1:19000/icons/1770697651962-folder2.svg	[{"url": "http://127.0.0.1:19000/icons/1770697651962-folder2.svg", "name": "folder2.svg", "order": 0}]	600	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:32.189	2026-04-28 03:29:25.152
cmlg3nwrh000pjlxp2n49xiam	hand	\N	\N	https://design5.pentasecurity.com/icons/1770697652226-hand.svg	http://127.0.0.1:19000/icons/1770697652226-hand.svg	[{"url": "http://127.0.0.1:19000/icons/1770697652226-hand.svg", "name": "hand.svg", "order": 0}]	735	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:32.382	2026-04-28 03:29:25.154
cmkx777700003ioodmkexw5uf	download	\N	\N	https://design5.pentasecurity.com/icons/1769554733746-download.svg	http://127.0.0.1:19000/icons/1769554733746-download.svg	[{"url": "http://127.0.0.1:19000/icons/1769554733746-download.svg", "name": "download.svg", "order": 0}]	606	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-27 22:58:53.868	2026-04-28 03:29:25.156
cmkx777bx0005ioodp02xx9vo	earth	\N	\N	https://design5.pentasecurity.com/icons/1769554733937-earth.svg	http://127.0.0.1:19000/icons/1769554733937-earth.svg	[{"url": "http://127.0.0.1:19000/icons/1769554733937-earth.svg", "name": "earth.svg", "order": 0}]	1085	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-27 22:58:54.046	2026-04-28 03:29:25.157
cmkx777hb0007ioodc3igh965	export	\N	\N	https://design5.pentasecurity.com/icons/1769554734115-export.svg	http://127.0.0.1:19000/icons/1769554734115-export.svg	[{"url": "http://127.0.0.1:19000/icons/1769554734115-export.svg", "name": "export.svg", "order": 0}]	608	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-27 22:58:54.239	2026-04-28 03:29:25.16
cmkx777mq0009ioodp8nd4rrz	sharing	\N	\N	https://design5.pentasecurity.com/icons/1769554734310-sharing.svg	http://127.0.0.1:19000/icons/1769554734310-sharing.svg	[{"url": "http://127.0.0.1:19000/icons/1769554734310-sharing.svg", "name": "sharing.svg", "order": 0}]	668	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-27 22:58:54.435	2026-04-28 03:29:25.163
cmkx777rr000bioodb6a5sy7f	sound	\N	\N	https://design5.pentasecurity.com/icons/1769554734506-sound.svg	http://127.0.0.1:19000/icons/1769554734506-sound.svg	[{"url": "http://127.0.0.1:19000/icons/1769554734506-sound.svg", "name": "sound.svg", "order": 0}]	775	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-27 22:58:54.616	2026-04-28 03:29:25.165
cmlg3obgg0011jlxp04ck2gj7	music	\N	\N	https://design5.pentasecurity.com/icons/1770697671293-music.svg	http://127.0.0.1:19000/icons/1770697671293-music.svg	[{"url": "http://127.0.0.1:19000/icons/1770697671293-music.svg", "name": "music.svg", "order": 0}]	652	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:51.425	2026-04-28 03:29:25.178
cmlg64y3l00014l8tidu006pt	attack	\N	\N	https://design5.pentasecurity.com/icons/1770701806142-attack.svg	http://127.0.0.1:19000/icons/1770701806142-attack.svg	[{"url": "http://127.0.0.1:19000/icons/1770701806142-attack.svg", "name": "attack.svg", "order": 0}]	651	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:36:46.497	2026-04-28 03:29:25.179
cmlg3oou40015jlxprd6nrpt6	person	\N	\N	https://design5.pentasecurity.com/icons/1770697688629-person.svg	http://127.0.0.1:19000/icons/1770697688629-person.svg	[{"url": "http://127.0.0.1:19000/icons/1770697688629-person.svg", "name": "person.svg", "order": 0}]	643	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:08.764	2026-04-28 03:29:25.189
cmlg3oz8x0005vhm3txd47q93	smartphone-ios	\N	\N	https://design5.pentasecurity.com/icons/1770697702128-smartphone-ios.svg	http://127.0.0.1:19000/icons/1770697702128-smartphone-ios.svg	[{"url": "http://127.0.0.1:19000/icons/1770697702128-smartphone-ios.svg", "name": "smartphone-ios.svg", "order": 0}]	574	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:22.257	2026-04-28 03:29:25.203
cmlg64yut000f4l8t6yug3lb1	cloud	\N	\N	https://design5.pentasecurity.com/icons/1770701807356-cloud.svg	http://127.0.0.1:19000/icons/1770701807356-cloud.svg	[{"url": "http://127.0.0.1:19000/icons/1770701807356-cloud.svg", "name": "cloud.svg", "order": 0}]	628	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:36:47.478	2026-04-28 03:29:25.23
cmlg3n42j0007jlxp7okbe9bt	bluetooth	\N	\N	https://design5.pentasecurity.com/icons/1770697615063-bluetooth.svg	http://127.0.0.1:19000/icons/1770697615063-bluetooth.svg	[{"url": "http://127.0.0.1:19000/icons/1770697615063-bluetooth.svg", "name": "bluetooth.svg", "order": 0}]	807	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:26:55.196	2026-04-28 03:29:25.235
cmlg3nhn70009jlxptx9b4x5g	camera	\N	\N	https://design5.pentasecurity.com/icons/1770697632635-camera.svg	http://127.0.0.1:19000/icons/1770697632635-camera.svg	[{"url": "http://127.0.0.1:19000/icons/1770697632635-camera.svg", "name": "camera.svg", "order": 0}]	555	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:12.783	2026-04-28 03:29:25.236
cmlg3n3ll0001jlxphdquk2kv	admin	\N	\N	https://design5.pentasecurity.com/icons/1770697613921-admin.svg	http://127.0.0.1:19000/icons/1770697613921-admin.svg	[{"url": "http://127.0.0.1:19000/icons/1770697613921-admin.svg", "name": "admin.svg", "order": 0}]	760	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:26:54.585	2026-04-28 03:29:25.239
cmlg3n3r80003jlxp08y0doqm	android	\N	\N	https://design5.pentasecurity.com/icons/1770697614661-android.svg	http://127.0.0.1:19000/icons/1770697614661-android.svg	[{"url": "http://127.0.0.1:19000/icons/1770697614661-android.svg", "name": "android.svg", "order": 0}]	1689	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:26:54.788	2026-04-28 03:29:25.243
cmlg3nhs3000bjlxpp5dxdrfn	click	\N	\N	https://design5.pentasecurity.com/icons/1770697632832-click.svg	http://127.0.0.1:19000/icons/1770697632832-click.svg	[{"url": "http://127.0.0.1:19000/icons/1770697632832-click.svg", "name": "click.svg", "order": 0}]	731	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:12.963	2026-04-28 03:29:25.246
cmlg65go40005wkjbnjcxpshd	db	\N	\N	https://design5.pentasecurity.com/icons/1770701830456-db.svg	http://127.0.0.1:19000/icons/1770701830456-db.svg	[{"url": "http://127.0.0.1:19000/icons/1770701830456-db.svg", "name": "db.svg", "order": 0}]	1098	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:10.562	2026-04-28 03:29:25.26
cmlg65gsb0007wkjbtd5gaowp	de	\N	\N	https://design5.pentasecurity.com/icons/1770701830587-de.svg	http://127.0.0.1:19000/icons/1770701830587-de.svg	[{"url": "http://127.0.0.1:19000/icons/1770701830587-de.svg", "name": "de.svg", "order": 0}]	4375	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:10.715	2026-04-28 03:29:25.262
cmlg65h2e000bwkjbxxit3281	directory-server	\N	\N	https://design5.pentasecurity.com/icons/1770701830926-directory-server.svg	http://127.0.0.1:19000/icons/1770701830926-directory-server.svg	[{"url": "http://127.0.0.1:19000/icons/1770701830926-directory-server.svg", "name": "directory-server.svg", "order": 0}]	940	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:11.078	2026-04-28 03:29:25.264
cmlg65h6w000dwkjb0x3m20ff	dp	\N	\N	https://design5.pentasecurity.com/icons/1770701831102-dp.svg	http://127.0.0.1:19000/icons/1770701831102-dp.svg	[{"url": "http://127.0.0.1:19000/icons/1770701831102-dp.svg", "name": "dp.svg", "order": 0}]	4746	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:11.241	2026-04-28 03:29:25.266
cmlg66nno0013wkjb9f6el822	network	\N	\N	https://design5.pentasecurity.com/icons/1770701886149-network.svg	http://127.0.0.1:19000/icons/1770701886149-network.svg	[{"url": "http://127.0.0.1:19000/icons/1770701886149-network.svg", "name": "network.svg", "order": 0}]	1157	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:06.276	2026-04-28 03:29:25.291
cmlg66nsj0015wkjbykmurrrr	not-access	\N	\N	https://design5.pentasecurity.com/icons/1770701886301-not-access.svg	http://127.0.0.1:19000/icons/1770701886301-not-access.svg	[{"url": "http://127.0.0.1:19000/icons/1770701886301-not-access.svg", "name": "not-access.svg", "order": 0}]	566	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:06.451	2026-04-28 03:29:25.293
cmlg679h1001xwkjb6gdqef9z	switch-l4	\N	\N	https://design5.pentasecurity.com/icons/1770701914435-switch-l4.svg	http://127.0.0.1:19000/icons/1770701914435-switch-l4.svg	[{"url": "http://127.0.0.1:19000/icons/1770701914435-switch-l4.svg", "name": "switch-l4.svg", "order": 0}]	1280	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:34.549	2026-04-28 03:29:25.323
cmlg679p70021wkjbk1sebl54	switch-san	\N	\N	https://design5.pentasecurity.com/icons/1770701914723-switch-san.svg	http://127.0.0.1:19000/icons/1770701914723-switch-san.svg	[{"url": "http://127.0.0.1:19000/icons/1770701914723-switch-san.svg", "name": "switch-san.svg", "order": 0}]	2061	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:34.843	2026-04-28 03:29:25.325
cmlh9olbp0009nw1wqoexyuxn	bulldozer	\N	\N	https://design5.pentasecurity.com/icons/1770768227955-bulldozer.svg	http://127.0.0.1:19000/icons/1770768227955-bulldozer.svg	[{"url": "http://127.0.0.1:19000/icons/1770768227955-bulldozer.svg", "name": "bulldozer.svg", "order": 0}]	855	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:03:48.086	2026-04-28 03:29:25.351
cmlh9p58h0001z377s8ao083j	car-suv_taxi	\N	\N	https://design5.pentasecurity.com/icons/1770768253583-car-suv_taxi.svg	http://127.0.0.1:19000/icons/1770768253583-car-suv_taxi.svg	[{"url": "http://127.0.0.1:19000/icons/1770768253583-car-suv_taxi.svg", "name": "car-suv_taxi.svg", "order": 0}]	1578	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:04:13.887	2026-04-28 03:29:25.354
cmlh9p5dr0003z377r0blqw3q	car-suv-ev	\N	\N	https://design5.pentasecurity.com/icons/1770768253925-car-suv-ev.svg	http://127.0.0.1:19000/icons/1770768253925-car-suv-ev.svg	[{"url": "http://127.0.0.1:19000/icons/1770768253925-car-suv-ev.svg", "name": "car-suv-ev.svg", "order": 0}]	1266	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:04:14.08	2026-04-28 03:29:25.356
cmlh9qvwk000de6b0hsf210y8	mri	\N	\N	https://design5.pentasecurity.com/icons/1770768334971-mri.svg	http://127.0.0.1:19000/icons/1770768334971-mri.svg	[{"url": "http://127.0.0.1:19000/icons/1770768334971-mri.svg", "name": "mri.svg", "order": 0}]	924	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:05:35.109	2026-04-28 03:29:25.383
cmlh9rtmp000fe6b0i06rrd81	passenger-ship	\N	\N	https://design5.pentasecurity.com/icons/1770768378647-passenger-ship.svg	http://127.0.0.1:19000/icons/1770768378647-passenger-ship.svg	[{"url": "http://127.0.0.1:19000/icons/1770768378647-passenger-ship.svg", "name": "passenger-ship.svg", "order": 0}]	1565	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:18.814	2026-04-28 03:29:25.387
cmlh9rtqp000he6b0l2ri54ec	plane1	\N	\N	https://design5.pentasecurity.com/icons/1770768378846-plane1.svg	http://127.0.0.1:19000/icons/1770768378846-plane1.svg	[{"url": "http://127.0.0.1:19000/icons/1770768378846-plane1.svg", "name": "plane1.svg", "order": 0}]	601	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:18.961	2026-04-28 03:29:25.389
cmlhbte2v0009pw06a8ve576q	break	\N	\N	https://design5.pentasecurity.com/icons/1770771811107-break.svg	http://127.0.0.1:19000/icons/1770771811107-break.svg	[{"url": "http://127.0.0.1:19000/icons/1770771811107-break.svg", "name": "break.svg", "order": 0}]	824	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:31.207	2026-04-28 03:29:25.42
cmlhbte78000bpw06jvct6iyr	bus-ev	\N	\N	https://design5.pentasecurity.com/icons/1770771811244-bus-ev.svg	http://127.0.0.1:19000/icons/1770771811244-bus-ev.svg	[{"url": "http://127.0.0.1:19000/icons/1770771811244-bus-ev.svg", "name": "bus-ev.svg", "order": 0}]	979	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:31.364	2026-04-28 03:29:25.422
cmlhbtebb000dpw06h3lqlbsf	bus	\N	\N	https://design5.pentasecurity.com/icons/1770771811402-bus.svg	http://127.0.0.1:19000/icons/1770771811402-bus.svg	[{"url": "http://127.0.0.1:19000/icons/1770771811402-bus.svg", "name": "bus.svg", "order": 0}]	734	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:31.511	2026-04-28 03:29:25.424
cmlhbtv12000fpw06yof91jm4	car-ev-front	\N	\N	https://design5.pentasecurity.com/icons/1770771832935-car-ev-front.svg	http://127.0.0.1:19000/icons/1770771832935-car-ev-front.svg	[{"url": "http://127.0.0.1:19000/icons/1770771832935-car-ev-front.svg", "name": "car-ev-front.svg", "order": 0}]	1370	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:53.171	2026-04-28 03:29:25.426
cmlhbtv5x000hpw06zkypc2xy	car-ev	\N	\N	https://design5.pentasecurity.com/icons/1770771833213-car-ev.svg	http://127.0.0.1:19000/icons/1770771833213-car-ev.svg	[{"url": "http://127.0.0.1:19000/icons/1770771833213-car-ev.svg", "name": "car-ev.svg", "order": 0}]	1179	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:53.35	2026-04-28 03:29:25.429
cmlhbtva7000jpw0686ir6ra9	car-front1	\N	\N	https://design5.pentasecurity.com/icons/1770771833389-car-front1.svg	http://127.0.0.1:19000/icons/1770771833389-car-front1.svg	[{"url": "http://127.0.0.1:19000/icons/1770771833389-car-front1.svg", "name": "car-front1.svg", "order": 0}]	1209	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:53.504	2026-04-28 03:29:25.431
cmlhbueps0011pw06c1xo94dn	gas-station	\N	\N	https://design5.pentasecurity.com/icons/1770771858593-gas-station.svg	http://127.0.0.1:19000/icons/1770771858593-gas-station.svg	[{"url": "http://127.0.0.1:19000/icons/1770771858593-gas-station.svg", "name": "gas-station.svg", "order": 0}]	696	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:18.689	2026-04-28 03:29:25.45
cmlhbueti0013pw06ohu4rcg2	gauge	\N	\N	https://design5.pentasecurity.com/icons/1770771858726-gauge.svg	http://127.0.0.1:19000/icons/1770771858726-gauge.svg	[{"url": "http://127.0.0.1:19000/icons/1770771858726-gauge.svg", "name": "gauge.svg", "order": 0}]	977	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:18.822	2026-04-28 03:29:25.452
cmlhbuexs0015pw06i8ttgtzd	indicator-lamp	\N	\N	https://design5.pentasecurity.com/icons/1770771858861-indicator-lamp.svg	http://127.0.0.1:19000/icons/1770771858861-indicator-lamp.svg	[{"url": "http://127.0.0.1:19000/icons/1770771858861-indicator-lamp.svg", "name": "indicator-lamp.svg", "order": 0}]	522	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:18.977	2026-04-28 03:29:25.454
cmlhbuf280017pw067llt28od	light	\N	\N	https://design5.pentasecurity.com/icons/1770771859013-light.svg	http://127.0.0.1:19000/icons/1770771859013-light.svg	[{"url": "http://127.0.0.1:19000/icons/1770771859013-light.svg", "name": "light.svg", "order": 0}]	862	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:19.136	2026-04-28 03:29:25.456
cmlhbvm96001xpw066ekywru9	temperature	\N	\N	https://design5.pentasecurity.com/icons/1770771914999-temperature.svg	http://127.0.0.1:19000/icons/1770771914999-temperature.svg	[{"url": "http://127.0.0.1:19000/icons/1770771914999-temperature.svg", "name": "temperature.svg", "order": 0}]	1192	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:05:15.114	2026-04-28 03:29:25.483
cmlhbvme1001zpw060c5ozlpw	traffic-light1	\N	\N	https://design5.pentasecurity.com/icons/1770771915151-traffic-light1.svg	http://127.0.0.1:19000/icons/1770771915151-traffic-light1.svg	[{"url": "http://127.0.0.1:19000/icons/1770771915151-traffic-light1.svg", "name": "traffic-light1.svg", "order": 0}]	704	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:05:15.289	2026-04-28 03:29:25.486
cmlhbvmi50021pw06bwwvvtmj	traffic-light2	\N	\N	https://design5.pentasecurity.com/icons/1770771915327-traffic-light2.svg	http://127.0.0.1:19000/icons/1770771915327-traffic-light2.svg	[{"url": "http://127.0.0.1:19000/icons/1770771915327-traffic-light2.svg", "name": "traffic-light2.svg", "order": 0}]	673	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:05:15.437	2026-04-28 03:29:25.488
cmlst5vef000pz5e4ybyd65g3	certification-institution	\N	\N	https://design5.pentasecurity.com/icons/1771466074796-certification-institution.svg	http://127.0.0.1:19000/icons/1771466074796-certification-institution.svg	[{"url": "http://127.0.0.1:19000/icons/1771466074796-certification-institution.svg", "name": "certification-institution.svg", "order": 0}]	1081	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:54:34.935	2026-04-28 03:29:25.517
cmlst5vjz000rz5e4qfdc88e4	certification1	\N	\N	https://design5.pentasecurity.com/icons/1771466074961-certification1.svg	http://127.0.0.1:19000/icons/1771466074961-certification1.svg	[{"url": "http://127.0.0.1:19000/icons/1771466074961-certification1.svg", "name": "certification1.svg", "order": 0}]	778	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:54:35.135	2026-04-28 03:29:25.519
cmlst5vnw000tz5e4k6dhxh3c	certification2	\N	\N	https://design5.pentasecurity.com/icons/1771466075160-certification2.svg	http://127.0.0.1:19000/icons/1771466075160-certification2.svg	[{"url": "http://127.0.0.1:19000/icons/1771466075160-certification2.svg", "name": "certification2.svg", "order": 0}]	522	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:54:35.276	2026-04-28 03:29:25.521
cmlst50vy0003z5e4g0wj9vup	appliance	\N	\N	https://design5.pentasecurity.com/icons/1771466035227-appliance.svg	http://127.0.0.1:19000/icons/1771466035227-appliance.svg	[{"url": "http://127.0.0.1:19000/icons/1771466035227-appliance.svg", "name": "appliance.svg", "order": 0}]	558	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:53:55.391	2026-04-28 03:29:25.554
cmlst510i0005z5e4irhw3kl1	ars	\N	\N	https://design5.pentasecurity.com/icons/1771466035416-ars.svg	http://127.0.0.1:19000/icons/1771466035416-ars.svg	[{"url": "http://127.0.0.1:19000/icons/1771466035416-ars.svg", "name": "ars.svg", "order": 0}]	1606	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:53:55.555	2026-04-28 03:29:25.557
cmlst515j0007z5e44duao1hy	bar-code	\N	\N	https://design5.pentasecurity.com/icons/1771466035581-bar-code.svg	http://127.0.0.1:19000/icons/1771466035581-bar-code.svg	[{"url": "http://127.0.0.1:19000/icons/1771466035581-bar-code.svg", "name": "bar-code.svg", "order": 0}]	1192	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:53:55.735	2026-04-28 03:29:25.559
cmlst51980009z5e4iq8g9414	box1	\N	\N	https://design5.pentasecurity.com/icons/1771466035761-box1.svg	http://127.0.0.1:19000/icons/1771466035761-box1.svg	[{"url": "http://127.0.0.1:19000/icons/1771466035761-box1.svg", "name": "box1.svg", "order": 0}]	504	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:53:55.869	2026-04-28 03:29:25.563
cmlst51dg000bz5e4zqhg74qa	box2	\N	\N	https://design5.pentasecurity.com/icons/1771466035894-box2.svg	http://127.0.0.1:19000/icons/1771466035894-box2.svg	[{"url": "http://127.0.0.1:19000/icons/1771466035894-box2.svg", "name": "box2.svg", "order": 0}]	763	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:53:56.02	2026-04-28 03:29:25.566
cmlst95dn001lz5e4557uoq2r	infra	\N	\N	https://design5.pentasecurity.com/icons/1771466227721-infra.svg	http://127.0.0.1:19000/icons/1771466227721-infra.svg	[{"url": "http://127.0.0.1:19000/icons/1771466227721-infra.svg", "name": "infra.svg", "order": 0}]	1253	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:07.835	2026-04-28 03:29:25.59
cmlst95h0001nz5e4bobp3mrh	ip-phone	\N	\N	https://design5.pentasecurity.com/icons/1771466227859-ip-phone.svg	http://127.0.0.1:19000/icons/1771466227859-ip-phone.svg	[{"url": "http://127.0.0.1:19000/icons/1771466227859-ip-phone.svg", "name": "ip-phone.svg", "order": 0}]	975	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:07.956	2026-04-28 03:29:25.592
cmlst95kx001pz5e4nxyyw8cq	leaf	\N	\N	https://design5.pentasecurity.com/icons/1771466227980-leaf.svg	http://127.0.0.1:19000/icons/1771466227980-leaf.svg	[{"url": "http://127.0.0.1:19000/icons/1771466227980-leaf.svg", "name": "leaf.svg", "order": 0}]	1200	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:08.097	2026-04-28 03:29:25.594
cmlst95pp001rz5e4reaytbf3	lighthouse	\N	\N	https://design5.pentasecurity.com/icons/1771466228125-lighthouse.svg	http://127.0.0.1:19000/icons/1771466228125-lighthouse.svg	[{"url": "http://127.0.0.1:19000/icons/1771466228125-lighthouse.svg", "name": "lighthouse.svg", "order": 0}]	875	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:08.269	2026-04-28 03:29:25.597
cmlst9vk6000f13mujidw7nqk	router	\N	\N	https://design5.pentasecurity.com/icons/1771466261662-router.svg	http://127.0.0.1:19000/icons/1771466261662-router.svg	[{"url": "http://127.0.0.1:19000/icons/1771466261662-router.svg", "name": "router.svg", "order": 0}]	994	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:41.766	2026-04-28 03:29:25.621
cmlstaazr000h13murs491fax	satellite	\N	\N	https://design5.pentasecurity.com/icons/1771466281555-satellite.svg	http://127.0.0.1:19000/icons/1771466281555-satellite.svg	[{"url": "http://127.0.0.1:19000/icons/1771466281555-satellite.svg", "name": "satellite.svg", "order": 0}]	1284	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:58:01.765	2026-04-28 03:29:25.624
cmlstab74000j13mue6lnsi7s	scanner	\N	\N	https://design5.pentasecurity.com/icons/1771466281796-scanner.svg	http://127.0.0.1:19000/icons/1771466281796-scanner.svg	[{"url": "http://127.0.0.1:19000/icons/1771466281796-scanner.svg", "name": "scanner.svg", "order": 0}]	593	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:58:02.032	2026-04-28 03:29:25.627
cmlstacho000l13muv435h4uu	ssl	\N	\N	https://design5.pentasecurity.com/icons/1771466282067-ssl.svg	http://127.0.0.1:19000/icons/1771466282067-ssl.svg	[{"url": "http://127.0.0.1:19000/icons/1771466282067-ssl.svg", "name": "ssl.svg", "order": 0}]	691	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:58:03.708	2026-04-28 03:29:25.631
cmkdpila90005utpife2sj6wq	품질 체크하는 사람	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________1_1768376171985_pjbk62lo7bd.png	http://127.0.0.1:19000/posts/character/______________1_1768376171985_pjbk62lo7bd.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________1_1768376171985_pjbk62lo7bd.svg", "name": "품질관리실1.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAATCAMAAACnUt2HAAAAD1BMVEXY293d3+Hi5OXU19nn6eoLq5n6AAAABXRSTlNGV2k2faOs8BgAAAAJcEhZcwAAD2EAAA9hAag/p2kAAABaSURBVHicbcxBDgAhDAJAsP7/zRtLsY1ZTjI2IH6C8YKbEUpk918nCgfBKyoEx4aIICk+tzLnzjS1qiyuoSLFOq04sanw2l7bjLKdKS2UlRPHmrTxYp7itaMf0SoCtIsbjvYAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________1_1768376171985_pjbk62lo7bd.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	품질관리실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 07:36:14.906	2026-04-28 03:29:25.651
cmkf3hp8o0003r1o29ggsnmn3	Cloudbric WAF+	\N	WAAP	https://design5.pentasecurity.com/posts/cloudbric/Cloudbric_WAF__1768460111550_3p22kurxz0b.pdf	http://127.0.0.1:19000/posts/cloudbric/Cloudbric_WAF__1768460111550_3p22kurxz0b.pdf	[{"url": "http://127.0.0.1:19000/posts/cloudbric/Cloudbric_WAF__1768460111550_3p22kurxz0b.pdf", "name": "Cloudbric_WAF+.pdf", "order": 0}]	0	image	image/*	cmkdc6dif000eflswndtrdztu	PUBLISHED	f	0	0	WAF+	KR	2026-01-11 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:55:14.177	2026-04-28 03:29:25.662
cmn5l5q4s0001d10sidp9r1p7	2025 iSIGN Password-less eDM	\N	\N	https://design5.pentasecurity.com/posts/penta-design/202506_iSIGN_Password_less_eDM_1774415469765_e954920h2yo.jpg	http://127.0.0.1:19000/posts/penta-design/202506_iSIGN_Password_less_eDM_1774415469765_e954920h2yo.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202506_iSIGN_Password_less_eDM_1774415469765_e954920h2yo.jpg", "name": "202506_iSIGN Password-less_eDM.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAYDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAIE/8QAGBABAQEBAQAAAAAAAAAAAAAAAAECBGH/xAAVAQEBAAAAAAAAAAAAAAAAAAACAf/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBAAIRAxEAPwCpz+DdMwOjETVAFX//2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202506_iSIGN_Password_less_eDM_1774415469765_e954920h2yo.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	1	0	\N	\N	2025-06-19 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-25 05:11:13.799	2026-05-19 01:21:23.584
cmkqersz3000513frut85thhb	game-console	\N	\N	https://design5.pentasecurity.com/icons/1769144188449-game-console.svg	http://127.0.0.1:19000/icons/1769144188449-game-console.svg	[{"url": "http://127.0.0.1:19000/icons/1769144188449-game-console.svg", "name": "game-console.svg", "order": 0}]	1045	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 04:56:29.078	2026-04-28 03:29:25.673
cmkqhtc9y0009dks1hu887a0p	refresh	\N	\N	https://design5.pentasecurity.com/icons/1769149298674-refresh.svg	http://127.0.0.1:19000/icons/1769149298674-refresh.svg	[{"url": "http://127.0.0.1:19000/icons/1769149298674-refresh.svg", "name": "refresh.svg", "order": 0}]	718	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:21:39.637	2026-04-28 03:29:25.677
cmmtxvchw0007ov7jt7805umf	VibeHack 2025	펜타시큐리티와 함께 만드는 AI 코드의 미래	\N	https://design5.pentasecurity.com/posts/penta-design/202512_VibeHack_2025_mail_did_1080x1920_1773711221080_l9fdhq8dom9.jpg	http://127.0.0.1:19000/posts/penta-design/202512_VibeHack_2025_mail_did_1080x1920_1773711221080_l9fdhq8dom9.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202512_VibeHack_2025_mail_did_1080x1920_1773711221080_l9fdhq8dom9.jpg", "name": "202512_VibeHack 2025_mail_did_1080x1920.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAsDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAEDAgX/xAAYEAEBAQEBAAAAAAAAAAAAAAAAARICEf/EABYBAQEBAAAAAAAAAAAAAAAAAAMBAv/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBAAIRAxEAPwDv4PC84PBaNSRryAMq/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202512_VibeHack_2025_mail_did_1080x1920_1773711221080_l9fdhq8dom9.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/202512_VibeHack_2025_ppt_01_1773711227140_uv5sd7fzhc.png", "name": "202512_VibeHack 2025_ppt_01.png", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMG/8QAFhABAQEAAAAAAAAAAAAAAAAAABIR/8QAFwEAAwEAAAAAAAAAAAAAAAAAAAECA//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANLJKo0QnIrgYf/Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202512_VibeHack_2025_ppt_01_1773711227140_uv5sd7fzhc.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	13	0	\N	\N	2025-12-04 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:33:50.441	2026-04-28 03:48:09.384
cmkdfpz06001b13veksr4p5sp	D.AMO Control Center	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_Control_Center_b_1768359720361_xzoadyxcau9.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_Control_Center_b_1768359720361_xzoadyxcau9.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_Control_Center_b_1768359720361_xzoadyxcau9.svg", "name": "D.AMO Control Center_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM9R/TDUbUAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAUSURBVHicY2CEAQZGBjhAFoQJAwACOAAWvqPIkwAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_Control_Center_b_1768359720361_xzoadyxcau9.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:02:03.126	2026-04-28 03:29:24.726
cmlh9qvob0009e6b08qltjvbi	key2	\N	\N	https://design5.pentasecurity.com/icons/1770768334709-key2.svg	http://127.0.0.1:19000/icons/1770768334709-key2.svg	[{"url": "http://127.0.0.1:19000/icons/1770768334709-key2.svg", "name": "key2.svg", "order": 0}]	725	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:05:34.811	2026-04-28 03:29:24.748
cmlg64yqz000d4l8t3y6ot6v0	cloud-upload	\N	\N	https://design5.pentasecurity.com/icons/1770701807213-cloud-upload.svg	http://127.0.0.1:19000/icons/1770701807213-cloud-upload.svg	[{"url": "http://127.0.0.1:19000/icons/1770701807213-cloud-upload.svg", "name": "cloud-upload.svg", "order": 0}]	844	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:36:47.339	2026-04-28 03:29:25.228
cmmtxapo700056pheuqlkad0a	펜타시큐리티 28주년 엠블램	\N	\N	https://design5.pentasecurity.com/posts/penta-design/202507_28th_Emblem________4_1773710265340_3753ehddh6t.jpg	http://127.0.0.1:19000/posts/penta-design/202507_28th_Emblem________2_1773710258141_btdhndltc7q.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202507_28th_Emblem________2_1773710258141_btdhndltc7q.jpg", "name": "202507_28th_Emblem_페이지_2.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL8AAAH/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202507_28th_Emblem________2_1773710258141_btdhndltc7q.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/202507_28th_Emblem________3_1773710262074_80o6hccu6ly.jpg", "name": "202507_28th_Emblem_페이지_3.jpg", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL8AAAH/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202507_28th_Emblem________3_1773710262074_80o6hccu6ly.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/202507_28th_Emblem________4_1773710265340_3753ehddh6t.jpg", "name": "202507_28th_Emblem_페이지_4.jpg", "order": 2, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAECBv/EABYQAQEBAAAAAAAAAAAAAAAAAAABEf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A2lpadSqKgAB//9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202507_28th_Emblem________4_1773710265340_3753ehddh6t.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	5	0	\N	\N	2025-07-17 15:00:00	cmkdc777200001251hxs59lzx	cmkw65m0400007y0ic9c0hnjk	2026-03-17 01:17:47.764	2026-04-28 03:29:25.232
cmkdg1w5d003k13vexo9ve8br	iSIGN Password-less	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_Password_less_b_1768360275934_nnfmyxyal0h.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_Password_less_b_1768360275934_nnfmyxyal0h.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_Password_less_b_1768360275934_nnfmyxyal0h.svg", "name": "iSIGN Password-less_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMvJraCcKgAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2BkZGRABowgATRBsAAAAUQAD24pttMAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_Password_less_b_1768360275934_nnfmyxyal0h.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:11:19.297	2026-04-28 03:29:25.619
cmmtxoen50005ov7jm6mfo9c9	제 3회 펜타시큐리티 개발자 컨퍼런스	Pencake v3	\N	https://design5.pentasecurity.com/posts/penta-design/202511___________________AI_pencake_01_1773710895670_50d7vzdfidn.jpg	http://127.0.0.1:19000/posts/penta-design/202511___________________AI_pencake_01_1773710895670_50d7vzdfidn.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202511___________________AI_pencake_01_1773710895670_50d7vzdfidn.jpg", "name": "202511_개발자컨퍼런스_AI_pencake_01.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAQABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAEEBv/EABUQAQEAAAAAAAAAAAAAAAAAAAAT/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAID/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A1lTohqdWaltAjqAf/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202511___________________AI_pencake_01_1773710895670_50d7vzdfidn.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/202511___________________did_1080x1920_1773710902390_k099bn356uo.jpg", "name": "202511_개발자컨퍼런스_did_1080x1920.jpg", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAsDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQb/xAAXEAEBAQEAAAAAAAAAAAAAAAAAAQIR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwL/xAAWEQEBAQAAAAAAAAAAAAAAAAAAAQL/2gAMAwEAAhEDEQA/AOmkNxmTktPqp5UAVRaf/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202511___________________did_1080x1920_1773710902390_k099bn356uo.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	9	0	\N	\N	2025-11-15 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:28:26.63	2026-04-30 00:15:31.446
cmkezei0a0003kiuwk33hvsfj	WAPPLES Cloud	\N	04_WAPPLES_Cloud	https://design5.pentasecurity.com/posts/wapples/WAPPLES_Cloud_Brochure_KR_241209_1768453244028_2p3wlqchqb4.pdf	http://127.0.0.1:19000/posts/wapples/WAPPLES_Cloud_Brochure_KR_241209_1768453244028_2p3wlqchqb4.pdf	[{"url": "http://127.0.0.1:19000/posts/wapples/WAPPLES_Cloud_Brochure_KR_241209_1768453244028_2p3wlqchqb4.pdf", "name": "WAPPLES_Cloud_Brochure_KR_241209.pdf", "order": 0}]	0	image	image/*	cmkdc6dfw000bflsw1kajwbt2	PUBLISHED	f	0	0	WAPPLES Cloud	KR	2024-12-28 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 05:00:46.269	2026-04-28 03:29:25.67
cmmty5k1c0003s4bluitw7t3m	인증서 디자인 리뉴얼	\N	\N	https://design5.pentasecurity.com/posts/penta-design/202601_______________________1773711701220_yk67w1xxwhd.jpg	http://127.0.0.1:19000/posts/penta-design/202601_______________________1773711701220_yk67w1xxwhd.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202601_______________________1773711701220_yk67w1xxwhd.jpg", "name": "202601_인증서 리뉴얼_가로.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAwACBf/EABgQAAMBAQAAAAAAAAAAAAAAAAABIQID/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAIE/8QAFREBAQAAAAAAAAAAAAAAAAAAABH/2gAMAwEAAhEDEQA/AOhzUEagPPUEeoaKgelSMa1SFH//2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202601_______________________1773711701220_yk67w1xxwhd.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/202601_______________________1773711704473_q7na8lz3j8.jpg", "name": "202601_인증서 리뉴얼_세로.jpg", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAA4DASIAAhEBAxEB/8QAFwABAAMAAAAAAAAAAAAAAAAAAAEEBf/EABcQAAMBAAAAAAAAAAAAAAAAAAABAhH/xAAXAQADAQAAAAAAAAAAAAAAAAAAAQIE/8QAFREBAQAAAAAAAAAAAAAAAAAAABH/2gAMAwEAAhEDEQA/ANKYDhCbRLtGioirNPA6YAg//9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202601_______________________1773711704473_q7na8lz3j8.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	5	0	\N	\N	2026-01-04 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:41:46.776	2026-04-28 03:29:25.641
cmkdpgyya0001utpif4cienyt	구름과 보안 아이콘들	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________1_1768376095233_f49pdurh2su.png	http://127.0.0.1:19000/posts/character/______________1_1768376095233_f49pdurh2su.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________1_1768376095233_f49pdurh2su.svg", "name": "미래사업본부1.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAABlBMVEXMzMzKyctZhVfNAAAAAnRSTlMlIKUOPRcAAAAJcEhZcwAAD2EAAA9hAag/p2kAAABGSURBVHicjdHbCgAgCAPQ7f9/OrpMjRa4l+AwIRQ0QbxYuVFhYhgmnH4NN14GOOS/iSdd7I/bZvufQruQsrmCUk3mDbR4DofHAJw+qb44AAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________1_1768376095233_f49pdurh2su.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	미래보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 07:34:59.307	2026-04-28 03:29:25.649
cmkqaqpcn0001yeb54411b71w	펜타 웰컴 보드 v1.0	\N	* 방문사 로고 삽입 시 투명 배경을 권장합니다. \n   - 삽입 후 위치 가이드(빨간 점선 박스)는 삭제해 주세요.\n\n* 제공되는 템플릿 그대로의 사용을 권장합니다. \n   - 입력되는 텍스트가 많거나 적을 때, 폰트 사이즈 조정 가능합니다.\n\n* 펜타시큐리티 CI는 넣지 않습니다. \n  - 스크린 위 실물로 크게 있기에 중복되지 않게 합니다.\n\n* 제작 후 이미지로 저장합니다. 파일 > 다른 이름으로 저장 > \n  확장자 png 또는 jpg 로 저장 후 ITinfra에 티켓 신청 및 파일을 업로드 합니다.\n   - [홍보용 디스플레이] 화면 출력 : ITinfra (LED/DID 게시 신청 티켓)\n\n* 레이아웃, 이미지 문의 : \n디자인팀 – 송지록 부장 jrsong@pentasecurity.com\n\n* 기타 문의 : \nEX팀 – 최인호 대리 inhochoi@pentasecurity.com	https://design5.pentasecurity.com/ppt-thumbnails/ppt-cmkqaqpcn0001yeb54411b71w-1769138905685.png	http://127.0.0.1:19000/posts/welcome-board/________________v1_0_1769137416165_pryla811aqe.pptx	[{"url": "http://127.0.0.1:19000/posts/welcome-board/________________v1_0_1769137416165_pryla811aqe.pptx", "name": "________________v1_0_1769137416165_pryla811aqe.pptx", "order": 0}]	0	image	image/*	cmkdc6df2000aflsw2zyg8umg	PUBLISHED	f	0	0	가로	KR	2024-05-30 00:00:00	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-23 03:03:39.473	2026-04-28 03:29:25.675
cmmtwxikc0007l5ml30e94afi	Cloudbric Mask 무료 서비스	\N	\N	https://design5.pentasecurity.com/posts/penta-design/Cloudbric_Mask__2__1774414626585_unp9ul5zta.png	http://127.0.0.1:19000/posts/penta-design/Cloudbric_Mask__2__1774414626585_unp9ul5zta.png	[{"url": "http://127.0.0.1:19000/posts/penta-design/Cloudbric_Mask__2__1774414626585_unp9ul5zta.png", "name": "Cloudbric Mask (2).png", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAYDASIAAhEBAxEB/8QAFwABAAMAAAAAAAAAAAAAAAAAAAQFBv/EABkQAQADAQEAAAAAAAAAAAAAAAABE1ECEv/EABYBAQEBAAAAAAAAAAAAAAAAAAEAAv/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBAAIRAxEAPwDee4EK+NDArrOtAbT/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/Cloudbric_Mask__2__1774414626585_unp9ul5zta.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/Cloudbric_Mask_____________________________________1773709646730_qazzdp5ak4c.png", "name": "Cloudbric Mask_회원_메인페이지_동영상미리보기_마스카 영역 편집02.png", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAECBv/EABcQAQEBAQAAAAAAAAAAAAAAAAACEQH/xAAVAQEBAAAAAAAAAAAAAAAAAAABAP/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBAAIRAxEAPwDaUnV0jpR6CBgf/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/Cloudbric_Mask_____________________________________1773709646730_qazzdp5ak4c.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/Cloudbric_Mask_____________________________________1773709649945_tul9zi4rtb.png", "name": "Cloudbric Mask_회원_메인페이지(파일 업로드중).png", "order": 2, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECBv/EABUQAQEAAAAAAAAAAAAAAAAAAAAR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDvINIogAj/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/Cloudbric_Mask_____________________________________1773709649945_tul9zi4rtb.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	36	0	\N	\N	2025-05-08 15:00:00	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-03-17 01:07:32.026	2026-04-28 03:29:25.689
cmn5lbm8h0005d10sz38yqff8	2025 펜타시큐리티 D.AMO 페이백 이벤트	\N	\N	https://design5.pentasecurity.com/posts/penta-design/202504_______________D_AMO_________________1774415745028_xzp68mh9uqf.jpg	http://127.0.0.1:19000/posts/penta-design/202504_______________D_AMO_________________1774415745028_xzp68mh9uqf.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202504_______________D_AMO_________________1774415745028_xzp68mh9uqf.jpg", "name": "202504_펜타시큐리티 D.AMO 페이백 이벤트.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAgDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAID/8QAFhABAQEAAAAAAAAAAAAAAAAAAAEC/8QAFwEAAwEAAAAAAAAAAAAAAAAAAAMFBv/EABYRAQEBAAAAAAAAAAAAAAAAAAARAf/aAAwDAQACEQMRAD8ACboaKJ0Y6tAMwP/Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202504_______________D_AMO_________________1774415745028_xzp68mh9uqf.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	7	0	\N	\N	2025-04-08 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-25 05:15:48.684	2026-05-15 07:42:42.52
cmmty7nzv0007s4bl31lsft29	POSTECH 학부 대학원 소식지 광고	\N	\N	https://design5.pentasecurity.com/posts/penta-design/202601_POSTECH_____________________________1773711802225_ulq09pc3u2l.jpg	http://127.0.0.1:19000/posts/penta-design/202601_POSTECH_____________________________1773711802225_ulq09pc3u2l.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202601_POSTECH_____________________________1773711802225_ulq09pc3u2l.jpg", "name": "202601_POSTECH-학부대학원-소식지-광고.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAA8DASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIFAQT/xAAaEAACAwEBAAAAAAAAAAAAAAAAAQMSUWEC/8QAFQEBAQAAAAAAAAAAAAAAAAAAAgP/xAAVEQEBAAAAAAAAAAAAAAAAAAAAEf/aAAwDAQACEQMRAD8AoXNscKm6OpulahE5e3o13oAEn//Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202601_POSTECH_____________________________1773711802225_ulq09pc3u2l.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	11	0	\N	\N	2026-01-22 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:43:25.242	2026-04-28 03:48:02.519
cmmtxrbru00076phejoic7lk8	2025 FISCON 행사	iSING Password-less, D.AMO, WAPPLES	\N	https://design5.pentasecurity.com/posts/penta-design/202511_FISCON2025_pentasecurity_20251104_1773711039592_9spo1xaxnfv.jpg	http://127.0.0.1:19000/posts/penta-design/202511_FISCON2025_pentasecurity_20251104_1773711039592_9spo1xaxnfv.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202511_FISCON2025_pentasecurity_20251104_1773711039592_9spo1xaxnfv.jpg", "name": "202511_FISCON2025_pentasecurity_20251104.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAKABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAMEAv/EABkQAQEBAAMAAAAAAAAAAAAAAAACAwEhMf/EABYBAQEBAAAAAAAAAAAAAAAAAAUCA//EABgRAQEAAwAAAAAAAAAAAAAAAAABERIT/9oADAMBAAIRAxEAPwCniWbzNkUSwM6VFWfYPr0LZ71//9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202511_FISCON2025_pentasecurity_20251104_1773711039592_9spo1xaxnfv.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	8	0	\N	\N	2025-11-20 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:30:42.871	2026-04-28 03:48:12.566
cmkqfviuw000l2faoac76ght4	mechanical-devices-1	\N	\N	https://design5.pentasecurity.com/icons/1769146041820-mechanical-devices-1.svg	http://127.0.0.1:19000/icons/1769146041820-mechanical-devices-1.svg	[{"url": "http://127.0.0.1:19000/icons/1769146041820-mechanical-devices-1.svg", "name": "mechanical-devices-1.svg", "order": 0}]	1226	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:27:22.242	2026-04-28 03:29:24.707
cmn5jtje10001zfxh8764yxfz	링크드인 이벤트	\N	\N	https://design5.pentasecurity.com/posts/penta-design/___________________1774413221372_w09yahqwhjg.png	http://127.0.0.1:19000/posts/penta-design/___________________1774413221372_w09yahqwhjg.png	[{"url": "http://127.0.0.1:19000/posts/penta-design/___________________1774413221372_w09yahqwhjg.png", "name": "링크드인 이벤트.png", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAUDASIAAhEBAxEB/8QAFwABAAMAAAAAAAAAAAAAAAAAAAMEBv/EABcQAQEBAQAAAAAAAAAAAAAAAAASARP/xAAWAQEBAQAAAAAAAAAAAAAAAAADAgT/xAAVEQEBAAAAAAAAAAAAAAAAAAAAEv/aAAwDAQACEQMRAD8A29CDoElFK1aA0Bf/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/___________________1774413221372_w09yahqwhjg.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	33	0	\N	\N	2026-03-16 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-25 04:33:45.45	2026-05-19 01:21:19.437
cmkf3jdz20007r1o2mriwcqsc	Cloudbric Managed Rules	\N	Public Cloud Security	https://design5.pentasecurity.com/posts/cloudbric/Cloudbric_Managed_Rules_1768460190773_i4990atujb.pdf	http://127.0.0.1:19000/posts/cloudbric/Cloudbric_Managed_Rules_1768460190773_i4990atujb.pdf	[{"url": "http://127.0.0.1:19000/posts/cloudbric/Cloudbric_Managed_Rules_1768460190773_i4990atujb.pdf", "name": "Cloudbric_Managed_Rules.pdf", "order": 0}]	0	image	image/*	cmkdc6dif000eflswndtrdztu	PUBLISHED	f	0	0	Managed Rules	KR	2025-04-02 15:00:00	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-15 06:56:32.665	2026-04-28 03:29:24.709
cmkqfvoak000r2fao2vqx6y0g	medical-records	\N	\N	https://design5.pentasecurity.com/icons/1769146049145-medical-records.svg	http://127.0.0.1:19000/icons/1769146049145-medical-records.svg	[{"url": "http://127.0.0.1:19000/icons/1769146049145-medical-records.svg", "name": "medical-records.svg", "order": 0}]	1105	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:27:29.468	2026-04-28 03:29:24.711
cmkqh2m9j0005kt0y2blugaba	machine-learning-1	\N	\N	https://design5.pentasecurity.com/icons/1769148052302-machine-learning-1.svg	http://127.0.0.1:19000/icons/1769148052302-machine-learning-1.svg	[{"url": "http://127.0.0.1:19000/icons/1769148052302-machine-learning-1.svg", "name": "machine-learning-1.svg", "order": 0}]	2894	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:00:53.047	2026-04-28 03:29:24.713
cmkqfvkor000n2faotp4hp9p0	mechanical-devices-2	\N	\N	https://design5.pentasecurity.com/icons/1769146044447-mechanical-devices-2.svg	http://127.0.0.1:19000/icons/1769146044447-mechanical-devices-2.svg	[{"url": "http://127.0.0.1:19000/icons/1769146044447-mechanical-devices-2.svg", "name": "mechanical-devices-2.svg", "order": 0}]	974	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:27:24.795	2026-04-28 03:29:24.715
cmkqfvmhl000p2faoaakdmu30	medical-certificate	\N	\N	https://design5.pentasecurity.com/icons/1769146046812-medical-certificate.svg	http://127.0.0.1:19000/icons/1769146046812-medical-certificate.svg	[{"url": "http://127.0.0.1:19000/icons/1769146046812-medical-certificate.svg", "name": "medical-certificate.svg", "order": 0}]	1069	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:27:27.129	2026-04-28 03:29:24.717
cmkqh2od60007kt0ys6qza1bp	machine-learning-2	\N	\N	https://design5.pentasecurity.com/icons/1769148055058-machine-learning-2.svg	http://127.0.0.1:19000/icons/1769148055058-machine-learning-2.svg	[{"url": "http://127.0.0.1:19000/icons/1769148055058-machine-learning-2.svg", "name": "machine-learning-2.svg", "order": 0}]	5440	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:00:55.77	2026-04-28 03:29:24.719
cmkqh2q5k0009kt0yn8ts4lmg	password	\N	\N	https://design5.pentasecurity.com/icons/1769148057783-password.svg	http://127.0.0.1:19000/icons/1769148057783-password.svg	[{"url": "http://127.0.0.1:19000/icons/1769148057783-password.svg", "name": "password.svg", "order": 0}]	1702	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:00:58.089	2026-04-28 03:29:24.721
cmkqh2s3n000bkt0yjjuuz7el	smart-city	\N	\N	https://design5.pentasecurity.com/icons/1769148060099-smart-city.svg	http://127.0.0.1:19000/icons/1769148060099-smart-city.svg	[{"url": "http://127.0.0.1:19000/icons/1769148060099-smart-city.svg", "name": "smart-city.svg", "order": 0}]	2167	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:01:00.611	2026-04-28 03:29:24.723
cmlg65stp000fwkjb2gt6md8c	encryption1	\N	\N	https://design5.pentasecurity.com/icons/1770701846159-encryption1.svg	http://127.0.0.1:19000/icons/1770701846159-encryption1.svg	[{"url": "http://127.0.0.1:19000/icons/1770701846159-encryption1.svg", "name": "encryption1.svg", "order": 0}]	556	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:26.315	2026-04-28 03:29:24.724
cmkdfrbi4001n13vek2unczb2	D.AMO DP	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_DP_b_1768359783076_pl45ace43nr.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_DP_b_1768359783076_pl45ace43nr.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_DP_b_1768359783076_pl45ace43nr.svg", "name": "D.AMO DP_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMsIQPLtsgAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAZSURBVHicY2BAAoxQgCwEguiCcDE0lVBBAATiACKmLMfsAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_DP_b_1768359783076_pl45ace43nr.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:03:05.981	2026-04-28 03:29:24.731
cmkdftaf2001z13ve0y10o18g	D.AMO KE-LNX	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_KE_LNX_b_1768359875226_yk8tmk46o.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_KE_LNX_b_1768359875226_yk8tmk46o.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_KE_LNX_b_1768359875226_yk8tmk46o.svg", "name": "D.AMO KE-LNX_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMyPcOL1VgAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAaSURBVHicY2CEAAYQhAOoICOSEFyQAawYCgAEKgAdo1op7AAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_KE_LNX_b_1768359875226_yk8tmk46o.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:04:37.886	2026-04-28 03:29:24.734
cmkdftoos002313vepmzaparx	D.AMO KMS	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_KMS_b_1768359893679_gu3oes2l4qg.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_KMS_b_1768359893679_gu3oes2l4qg.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_KMS_b_1768359893679_gu3oes2l4qg.svg", "name": "D.AMO KMS_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMqIVWREU4AAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAcSURBVHicY2BkZGBkQAKMjCARRlQxsACqGEQlAAKvABVqppYRAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_KMS_b_1768359893679_gu3oes2l4qg.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:04:56.38	2026-04-28 03:29:24.736
cmkdfx9o8002s13ve94djclhw	iSIGN Energy_b	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_Energy_b_1768360060608_yzdu2qp9m6l.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_Energy_b_1768360060608_yzdu2qp9m6l.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_Energy_b_1768360060608_yzdu2qp9m6l.svg", "name": "iSIGN Energy_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMSG4QCdAcAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2BEAAY4QAiBILogIZUACEwALWAI1fEAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_Energy_b_1768360060608_yzdu2qp9m6l.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:07:43.545	2026-04-28 03:29:24.738
cmkdfxwvu002w13ve14ztbpjd	iSIGN Home	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_Home_b_1768360090898_rdqxd6w7oqn.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_Home_b_1768360090898_rdqxd6w7oqn.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_Home_b_1768360090898_rdqxd6w7oqn.svg", "name": "iSIGN Home_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMYI1bvJBMAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAcSURBVHicY2CEAQZGBjiACyKJwQUZkEWRtcOEAQewACpm9ToeAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_Home_b_1768360090898_rdqxd6w7oqn.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:08:13.626	2026-04-28 03:29:24.74
cmkf3kpbz000br1o2pzl6v8ep	Cloudbric PAS	\N	ZTNA	https://design5.pentasecurity.com/posts/cloudbric/Cloudbric_PAS_1768460252365_crx751aq2ga.pdf	http://127.0.0.1:19000/posts/cloudbric/Cloudbric_PAS_1768460252365_crx751aq2ga.pdf	[{"url": "http://127.0.0.1:19000/posts/cloudbric/Cloudbric_PAS_1768460252365_crx751aq2ga.pdf", "name": "Cloudbric_PAS.pdf", "order": 0}]	0	image	image/*	cmkdc6dif000eflswndtrdztu	PUBLISHED	f	0	0	PAS	KR	2025-12-18 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:57:34.263	2026-04-28 03:29:24.742
cmlg679l5001zwkjb0u9lnrii	switch-normal	\N	\N	https://design5.pentasecurity.com/icons/1770701914573-switch-normal.svg	http://127.0.0.1:19000/icons/1770701914573-switch-normal.svg	[{"url": "http://127.0.0.1:19000/icons/1770701914573-switch-normal.svg", "name": "switch-normal.svg", "order": 0}]	1223	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:34.698	2026-04-28 03:29:24.744
cmlh9ol7f0007nw1w2pyqpkex	bot	\N	\N	https://design5.pentasecurity.com/icons/1770768227820-bot.svg	http://127.0.0.1:19000/icons/1770768227820-bot.svg	[{"url": "http://127.0.0.1:19000/icons/1770768227820-bot.svg", "name": "bot.svg", "order": 0}]	1053	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:03:47.931	2026-04-28 03:29:24.746
cmkdfu542002713ve4ef8q9tl	D.AMO KMS-SC	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_KMS_SC_b_1768359914763_65ic4adpt3v.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_KMS_SC_b_1768359914763_65ic4adpt3v.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_KMS_SC_b_1768359914763_65ic4adpt3v.svg", "name": "D.AMO KMS-SC_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM1PhXDEiUAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAXSURBVHicY2CEAAYUABUDQXRBsFK4MAADkgAZC6pgywAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_KMS_SC_b_1768359914763_65ic4adpt3v.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:05:17.667	2026-04-28 03:29:24.754
cmkdfui7y002b13ve5i1w7ou4	D.AMO SAP	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_SAP_b_1768359932129_r6znxvu5lgq.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_SAP_b_1768359932129_r6znxvu5lgq.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_SAP_b_1768359932129_r6znxvu5lgq.svg", "name": "D.AMO SAP_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMiKZOTE3QAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAZSURBVHicY2BgYGBEBgwwgCQEE0RRCBYEAATwACcpRf5WAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_SAP_b_1768359932129_r6znxvu5lgq.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:05:34.654	2026-04-28 03:29:24.756
cmkdfuyv4002f13vepp53cupt	D.AMO SG-KMS	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_SG_KMS_b_1768359952943_5j23qaew7er.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_SG_KMS_b_1768359952943_5j23qaew7er.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_SG_KMS_b_1768359952943_5j23qaew7er.svg", "name": "D.AMO SG-KMS_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMyPLSM5c4AAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAWSURBVHicY2CEAgZGBgSACaIIY1MIAARWAB0WI0pgAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_SG_KMS_b_1768359952943_5j23qaew7er.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:05:56.224	2026-04-28 03:29:24.758
cmkdfws00002o13ve5iq0eohg	iSIGN Channel Encryption	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_Channel_Encryption_b_1768360036964_dihvcowbtk9.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_Channel_Encryption_b_1768360036964_dihvcowbtk9.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_Channel_Encryption_b_1768360036964_dihvcowbtk9.svg", "name": "iSIGN Channel Encryption_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM+N4/rc0oAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAATSURBVHicY2BABowQgCwCgmBBAAEAABCN5yt/AAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_Channel_Encryption_b_1768360036964_dihvcowbtk9.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:07:20.641	2026-04-28 03:29:24.76
cmlhbtdpr0003pw0664k42uqy	airbag	\N	\N	https://design5.pentasecurity.com/icons/1770771810607-airbag.svg	http://127.0.0.1:19000/icons/1770771810607-airbag.svg	[{"url": "http://127.0.0.1:19000/icons/1770771810607-airbag.svg", "name": "airbag.svg", "order": 0}]	916	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:30.736	2026-04-28 03:29:24.762
cmlhbuec6000vpw06hljpr9qa	drive-thru	\N	\N	https://design5.pentasecurity.com/icons/1770771858053-drive-thru.svg	http://127.0.0.1:19000/icons/1770771858053-drive-thru.svg	[{"url": "http://127.0.0.1:19000/icons/1770771858053-drive-thru.svg", "name": "drive-thru.svg", "order": 0}]	1594	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:18.199	2026-04-28 03:29:24.764
cmlhbvlma001npw062x9nx7ef	scooter	\N	\N	https://design5.pentasecurity.com/icons/1770771914130-scooter.svg	http://127.0.0.1:19000/icons/1770771914130-scooter.svg	[{"url": "http://127.0.0.1:19000/icons/1770771914130-scooter.svg", "name": "scooter.svg", "order": 0}]	978	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:05:14.287	2026-04-28 03:29:24.766
cmkqhtg3d000ddks1xlh9se61	warnings	\N	\N	https://design5.pentasecurity.com/icons/1769149304036-warnings.svg	http://127.0.0.1:19000/icons/1769149304036-warnings.svg	[{"url": "http://127.0.0.1:19000/icons/1769149304036-warnings.svg", "name": "warnings.svg", "order": 0}]	672	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:21:44.762	2026-04-28 03:29:24.767
cmkdg1bsf003g13veb3bzvi72	iSIGN PASS	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_PASS_b_1768360249748_ivx1ibpq41.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_b_1768360249748_ivx1ibpq41.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_b_1768360249748_ivx1ibpq41.svg", "name": "iSIGN PASS_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMwJJXWHxoAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAZSURBVHicY2BAAEYYQBGDCSOEQBBDJZIoAAWdACYmsGufAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_PASS_b_1768360249748_ivx1ibpq41.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:10:52.911	2026-04-28 03:29:24.774
cmlst7dsh001bz5e4jt9d78z4	first	\N	\N	https://design5.pentasecurity.com/icons/1771466144760-first.svg	http://127.0.0.1:19000/icons/1771466144760-first.svg	[{"url": "http://127.0.0.1:19000/icons/1771466144760-first.svg", "name": "first.svg", "order": 0}]	653	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:55:45.426	2026-04-28 03:29:24.776
cmlst94xx001dz5e4yxu5ycro	gift-box	\N	\N	https://design5.pentasecurity.com/icons/1771466227106-gift-box.svg	http://127.0.0.1:19000/icons/1771466227106-gift-box.svg	[{"url": "http://127.0.0.1:19000/icons/1771466227106-gift-box.svg", "name": "gift-box.svg", "order": 0}]	700	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:07.267	2026-04-28 03:29:24.778
cmlst9vc5000b13muwmvd2rp4	radio-tower	\N	\N	https://design5.pentasecurity.com/icons/1771466261357-radio-tower.svg	http://127.0.0.1:19000/icons/1771466261357-radio-tower.svg	[{"url": "http://127.0.0.1:19000/icons/1771466261357-radio-tower.svg", "name": "radio-tower.svg", "order": 0}]	917	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:41.477	2026-04-28 03:29:24.779
cmlstacqo000p13muzd04yqvx	transmission-tower	\N	\N	https://design5.pentasecurity.com/icons/1771466283886-transmission-tower.svg	http://127.0.0.1:19000/icons/1771466283886-transmission-tower.svg	[{"url": "http://127.0.0.1:19000/icons/1771466283886-transmission-tower.svg", "name": "transmission-tower.svg", "order": 0}]	1395	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:58:04.033	2026-04-28 03:29:24.781
cmkdfzbxc003813vebc729nxf	iSIGN PASS Factor	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_PASS_Factor_b_1768360157210_x1b4ngsz95.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_Factor_b_1768360157210_x1b4ngsz95.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_Factor_b_1768360157210_x1b4ngsz95.svg", "name": "iSIGN PASS Factor_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMsI+3F1+QAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2BkZGRABowgARBEFwQAATAADsS2NPQAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_PASS_Factor_b_1768360157210_x1b4ngsz95.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:09:19.777	2026-04-28 03:29:24.783
cmkdfztwu003c13velhgepz0e	iSIGN PASS Server	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_PASS_Server_b_1768360180153_5nzl6n4175j.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_Server_b_1768360180153_5nzl6n4175j.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_Server_b_1768360180153_5nzl6n4175j.svg", "name": "iSIGN PASS Server_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMsJHOhQkcAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2BkZGRAAowgwABC6KIAAVwAEB9sx+8AAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_PASS_Server_b_1768360180153_5nzl6n4175j.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:09:43.087	2026-04-28 03:29:24.785
cmkdg2g91003o13ve77oea698	iSIGN PKI	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_PKI_b_1768360302818_7y62pvp5pby.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_PKI_b_1768360302818_7y62pvp5pby.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_PKI_b_1768360302818_7y62pvp5pby.svg", "name": "iSIGN PKI_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAFCAMAAABy3TwBAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMXGRd74W4AAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAaSURBVHicY2CEAwYEwCeIJAIXRBWDCKKJAQAKOwAnQQoMFgAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_PKI_b_1768360302818_7y62pvp5pby.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:11:45.349	2026-04-28 03:29:24.788
cmkurqv220003y5pvet5kxi8z	flag	\N	\N	https://design5.pentasecurity.com/icons/1769407844603-flag.svg	http://127.0.0.1:19000/icons/1769407844603-flag.svg	[{"url": "http://127.0.0.1:19000/icons/1769407844603-flag.svg", "name": "flag.svg", "order": 0}]	543	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:10:45.051	2026-04-28 03:29:24.79
cmkdg4u5g004113veeg0y4rlz	Cloudbric Managed Rules	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Cloudbric_Managed_Rules_b_1768360413718_eouc761r8za.png	http://127.0.0.1:19000/posts/ci-bi/Cloudbric_Managed_Rules_b_1768360413718_eouc761r8za.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Cloudbric_Managed_Rules_b_1768360413718_eouc761r8za.svg", "name": "Cloudbric Managed Rules_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM8OVplPM8AAAAJcEhZcwAAD2EAAA9hAag/p2kAAAASSURBVHicY2BABYwggCYGEQQAALEACx7SLhMAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Cloudbric_Managed_Rules_b_1768360413718_eouc761r8za.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:13:36.676	2026-04-28 03:29:24.796
cmkdg5u5f004513veaqujpinl	Cloudbric Maska	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Cloudbric_Maska_b_1768360460258_e5ognsitlup.png	http://127.0.0.1:19000/posts/ci-bi/Cloudbric_Maska_b_1768360460258_e5ognsitlup.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Cloudbric_Maska_b_1768360460258_e5ognsitlup.svg", "name": "Cloudbric Maska_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMiJgMsDuUAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAaSURBVHicY2BgYGRkZGBkZEAGjAiAVRAuAwADswAhuS6KwQAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Cloudbric_Maska_b_1768360460258_e5ognsitlup.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:14:23.331	2026-04-28 03:29:24.798
cmkdg6frr004913veo4dtcsq9	Cloudbric PAS	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Cloudbric_PAS_b_1768360488635_kewvytr11i.png	http://127.0.0.1:19000/posts/ci-bi/Cloudbric_PAS_b_1768360488635_kewvytr11i.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Cloudbric_PAS_b_1768360488635_kewvytr11i.svg", "name": "Cloudbric PAS_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMvMTVR9W8AAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2DACRgZGBhhACaEBhgAAgAAG8lh2RoAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Cloudbric_PAS_b_1768360488635_kewvytr11i.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:14:51.351	2026-04-28 03:29:24.802
cmkdg6wsz004d13ve9cnpulot	Cloudbric VPN	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Cloudbric_VPN_b_1768360510809_6lyply90445.png	http://127.0.0.1:19000/posts/ci-bi/Cloudbric_VPN_b_1768360510809_6lyply90445.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Cloudbric_VPN_b_1768360510809_6lyply90445.svg", "name": "Cloudbric VPN_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMuMFtN9LgAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2BABowQgM6HCyLzwYIAA2QAJWF6ljcAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Cloudbric_VPN_b_1768360510809_6lyply90445.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:15:13.427	2026-04-28 03:29:24.804
cmkdg7ag8004h13vey1g78bt1	Cloudbric WAF+	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Cloudbric_WAF__b_1768360528548_n5qix15yok.png	http://127.0.0.1:19000/posts/ci-bi/Cloudbric_WAF__b_1768360528548_n5qix15yok.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Cloudbric_WAF__b_1768360528548_n5qix15yok.svg", "name": "Cloudbric WAF+_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMiGixDcmIAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2BABowQgCIEguiCcJUAAk8AFj5AaJYAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Cloudbric_WAF__b_1768360528548_n5qix15yok.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:15:31.112	2026-04-28 03:29:24.806
cmkdg7mpw004l13ve8pxq8ifj	Cloudbric WMS	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Cloudbric_WMS_b_1768360544482_hkys0mb0qdq.png	http://127.0.0.1:19000/posts/ci-bi/Cloudbric_WMS_b_1768360544482_hkys0mb0qdq.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Cloudbric_WMS_b_1768360544482_hkys0mb0qdq.svg", "name": "Cloudbric WMS_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMpK55pq5MAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAXSURBVHicY2BABowMjEhsEAEHqDyYKAACggAgJuKF5AAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Cloudbric_WMS_b_1768360544482_hkys0mb0qdq.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:15:47.013	2026-04-28 03:29:24.808
cmkdg8nvz004t13ve7yj2tcpb	Crytobric	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Crytobric_b_1768360592452_8kra1v8bimf.png	http://127.0.0.1:19000/posts/ci-bi/Crytobric_b_1768360592452_8kra1v8bimf.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Crytobric_b_1768360592452_8kra1v8bimf.svg", "name": "Crytobric_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMQDDXnk0IAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAdSURBVHicY2BkQAWMjIyMDIxootgEQWLogmAxRgAD3wAbf8NqZgAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Crytobric_b_1768360592452_8kra1v8bimf.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:16:35.183	2026-04-28 03:29:24.81
cmkdga243005213vepprn7ybi	WAPPLES SA	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/WAPPLES_SA_b_1768360657332_iap3owu5lst.png	http://127.0.0.1:19000/posts/ci-bi/WAPPLES_SA_b_1768360657332_iap3owu5lst.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/WAPPLES_SA_b_1768360657332_iap3owu5lst.svg", "name": "WAPPLES SA_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM1L39zMtcAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAYSURBVHicY2BABYwgwMCIRZSBEU0UJAgAAdgAEU+tqoMAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/WAPPLES_SA_b_1768360657332_iap3owu5lst.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:17:40.276	2026-04-28 03:29:24.818
cmkdgafwd005613vewzpasm1w	WAPPLES	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/WAPPLES_b_1768360675108_c5xxzkvwmf6.png	http://127.0.0.1:19000/posts/ci-bi/WAPPLES_b_1768360675108_c5xxzkvwmf6.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/WAPPLES_b_1768360675108_c5xxzkvwmf6.svg", "name": "WAPPLES_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMpJXnRhpQAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAcSURBVHicY2BkZGRkQAGMjAw4BVFFYYIoooyMAATAABwhKS8AAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/WAPPLES_b_1768360675108_c5xxzkvwmf6.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:17:58.142	2026-04-28 03:29:24.82
cmkdgbbo0005b13vecfvi1zqp	검증필 암호 모듈 Penta CC	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/______________________Penta_CC_b_1768360716607_z91y1qr9cjn.png	http://127.0.0.1:19000/posts/ci-bi/______________________Penta_CC_b_1768360716607_z91y1qr9cjn.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/______________________Penta_CC_b_1768360716607_z91y1qr9cjn.svg", "name": "검증필 암호 모듈 Penta CC_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM2MNlWbOEAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2BkZGRAAowgwACC6IIAAU8AEHwGmMcAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/______________________Penta_CC_b_1768360716607_z91y1qr9cjn.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:18:39.312	2026-04-28 03:29:24.823
cmkdgbvl4005f13ve7jx7ri2p	검증필 암호 모듈 Penta IoT-CC	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/______________________Penta_IoT_CC_b_1768360741646_u71nntq3czh.png	http://127.0.0.1:19000/posts/ci-bi/______________________Penta_IoT_CC_b_1768360741646_u71nntq3czh.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/______________________Penta_IoT_CC_b_1768360741646_u71nntq3czh.svg", "name": "검증필 암호 모듈 Penta IoT-CC_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM5Nret1RsAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAASSURBVHicY2BABYwggCYGEQQAALEACx7SLhMAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/______________________Penta_IoT_CC_b_1768360741646_u71nntq3czh.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:19:05.128	2026-04-28 03:29:24.825
cmkdgc87i005j13ve2b87o5kd	Penta Cloud Security	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Penta_Cloud_Security_b_1768360758714_lywlfctdana.png	http://127.0.0.1:19000/posts/ci-bi/Penta_Cloud_Security_b_1768360758714_lywlfctdana.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Penta_Cloud_Security_b_1768360758714_lywlfctdana.svg", "name": "Penta Cloud Security_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMVHFUnd2MAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAWSURBVHicY2CEAQYkABVBEYMKoooCAAPVABk/ClvGAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Penta_Cloud_Security_b_1768360758714_lywlfctdana.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:19:21.486	2026-04-28 03:29:24.827
cmkdgcoe9005n13ve5fr580zg	Penta IoT Security	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Penta_IoT_Security_b_1768360779401_0jmiqszswhzv.png	http://127.0.0.1:19000/posts/ci-bi/Penta_IoT_Security_b_1768360779401_0jmiqszswhzv.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Penta_IoT_Security_b_1768360779401_0jmiqszswhzv.svg", "name": "Penta IoT Security_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMmHdZLIsUAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAXSURBVHicY2BAAEYGRgjAIoQQBAnBRQEDBAAedeYnqgAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Penta_IoT_Security_b_1768360779401_0jmiqszswhzv.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:19:42.465	2026-04-28 03:29:24.829
cmknasqe2000312susqwzr9cf	맑은고딕 국문	\N	v3.1 , 16:9	https://design5.pentasecurity.com/ppt-thumbnails/ppt-cmknasqe2000312susqwzr9cf-1775720426826.jpg	http://127.0.0.1:19000/posts/ppt/PPT_Template_KR_Malgun_v3_1_1775720423721_vmtoxugvcrr.pptx	[{"url": "http://127.0.0.1:19000/posts/ppt/PPT_Template_KR_Malgun_v3_1_1775720423721_vmtoxugvcrr.pptx", "name": "PPT_Template_KR_Malgun_v3.1.pptx", "order": 0}]	0	image	image/*	cmkdc6dch0007flswqgemr713	PUBLISHED	f	0	0	가로	KR	2026-04-09 00:00:00	cmkdc777200001251hxs59lzx	cmkw65m0400007y0ic9c0hnjk	2026-01-21 00:41:55.605	2026-04-28 03:29:24.843
cmkdge230005z13vei0kj41re	Penta	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Penta_b_1768360844270_nmtnfw3jw0k.png	http://127.0.0.1:19000/posts/ci-bi/Penta_b_1768360844270_nmtnfw3jw0k.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Penta_b_1768360844270_nmtnfw3jw0k.svg", "name": "Penta_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAHCAMAAAA/FZ0KAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMRFUiXCsMAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAfSURBVHicY2BgYGBEAAYoQBJCiBIhCBUlQhCrTWAhABw1AGFHj9GAAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Penta_b_1768360844270_nmtnfw3jw0k.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:20:46.861	2026-04-28 03:29:24.845
cmkdhthr50001nvum8xs0jssk	MyDiamo	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/MyDiamo_b_1768363243193_qocgwmhib8a.png	http://127.0.0.1:19000/posts/ci-bi/MyDiamo_b_1768363243193_qocgwmhib8a.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/MyDiamo_b_1768363243193_qocgwmhib8a.svg", "name": "MyDiamo_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAFCAMAAABy3TwBAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMWD/q0ZX4AAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAeSURBVHicY2BABYwggCoCEUMVhCpEEYQpRNMOFQYABe4AIjNJk/oAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/MyDiamo_b_1768363243193_qocgwmhib8a.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 04:00:46.625	2026-04-28 03:29:24.847
cmkdhutv70005nvumtv7bhcbo	Penta Security CI - Basic	\N	\N	https://design5.pentasecurity.com/posts/ci-bi/penta_ci_basic_1768363306332_b4spnwlttre.svg	http://127.0.0.1:19000/posts/ci-bi/penta_ci_basic_1768363306332_b4spnwlttre.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/penta_ci_basic_1768363306332_b4spnwlttre.svg", "name": "penta_ci_basic.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUnbaRBd6GskipXAAAAAnRSTlM6K/+G6gEAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAUSURBVHicY2BABYwgwMCIKgYWBQAAxgAM/CuufwAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/penta_ci_basic_1768363306332_b4spnwlttre.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	CI	\N	\N	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-14 04:01:48.98	2026-04-28 03:29:24.849
cmkdoevb50001sp7r1y0ypfjc	대표이사 1	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_________1768374317148_w8h0bmzqvn.png	http://127.0.0.1:19000/posts/character/_________1768374317148_w8h0bmzqvn.svg	[{"url": "http://127.0.0.1:19000/posts/character/_________1768374317148_w8h0bmzqvn.svg", "name": "대표이사.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAARCAMAAADqmnyMAAAABlBMVEXCxMXKy8yCpcXXAAAAAnRSTlM+KXXkTikAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA5SURBVHicY2CEAwZGBhjAIsSAV5ABWYwBJogCGHGqRBUiXSWaKB4nEa8STRhJDDOUUIQRghBRkAwAZkoAlhXhpcwAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_________1768374317148_w8h0bmzqvn.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	대표이사	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 07:05:21.53	2026-04-28 03:29:24.859
cmkdoillj0005sp7rkdql2kwc	보안사업본부 1	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______________1_1768374491293_jx6tnbisy9.png	http://127.0.0.1:19000/posts/character/_______________1_1768374491293_jx6tnbisy9.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______________1_1768374491293_jx6tnbisy9.svg", "name": "보안사업본부1.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAPCAMAAADTRh9nAAAABlBMVEVimL19or4C9FbrAAAAAnRSTlMwJeLRL4wAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA3SURBVHicY2CEAQZGBgYGBigTWYQBDFAFGWAyUEFUgKYOIYguRqpKorVjVYndndhVoolj8TsjAEVVAGJSS9lOAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______________1_1768374491293_jx6tnbisy9.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 07:08:15.696	2026-04-28 03:29:24.861
cmkdojdb80007sp7rpaz634ov	인증보안사업본부 1	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_____________________1_1768374528377_mjgsmsr1vg.png	http://127.0.0.1:19000/posts/character/_____________________1_1768374528377_mjgsmsr1vg.svg	[{"url": "http://127.0.0.1:19000/posts/character/_____________________1_1768374528377_mjgsmsr1vg.svg", "name": "인증보안사업본부1.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAPCAMAAADTRh9nAAAAFVBMVEW7ztvE1N/K2eK6zdrP3OXc5evV4OgO/L8cAAAAB3RSTlNvfYtembamDSq9xQAAAAlwSFlzAAAPYQAAD2EBqD+naQAAAElJREFUeJxlykEOACEIQ9EKo/c/8kRLG4l/VV5AnlAlr2YgoxMKzxys9JKNmzMlMUK/xFBSWMTET1lhKiYudamNTJxVUyH9ResPTRUC87p97ikAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_____________________1_1768374528377_mjgsmsr1vg.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인증보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 07:08:51.614	2026-04-28 03:29:24.863
cmkdphths0003utpiuhgmafhq	전구와 사람	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/________4_1768376135305_4gl5nm2jpgg.png	http://127.0.0.1:19000/posts/character/________4_1768376135305_4gl5nm2jpgg.svg	[{"url": "http://127.0.0.1:19000/posts/character/________4_1768376135305_4gl5nm2jpgg.svg", "name": "기획실4.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAUCAMAAABh7EcdAAAABlBMVEWXin+lknivFAnQAAAAAnRSTlMrH43rPaQAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAjSURBVHicY2BEBgyk8RgYGRhABIgHYkMwmAcHEPmhAFBcCQBDjABJcc0jKwAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/________4_1768376135305_4gl5nm2jpgg.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	기획실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 07:35:38.889	2026-04-28 03:29:24.865
cmmtxd79l0001ov7jgipcmty2	2025 전자신문 지면광고 (D.AMO)	\N	\N	https://design5.pentasecurity.com/posts/penta-design/202508_________________________D_AMO__1773710379558_xpgn420xbtq.jpg	http://127.0.0.1:19000/posts/penta-design/202508_________________________D_AMO__1773710379558_xpgn420xbtq.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202508_________________________D_AMO__1773710379558_xpgn420xbtq.jpg", "name": "202508_전자신문 지면광고 (D.AMO).jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAHABQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAEG/8QAFhABAQEAAAAAAAAAAAAAAAAAAAER/8QAFgEBAQEAAAAAAAAAAAAAAAAAAgAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Ay+paBigCa//Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202508_________________________D_AMO__1773710379558_xpgn420xbtq.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	5	0	\N	\N	2025-08-12 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:19:43.853	2026-04-28 03:29:24.867
cmkurvo860005y5pvpf0nqw48	delete	\N	\N	https://design5.pentasecurity.com/icons/1769408068848-delete.svg	http://127.0.0.1:19000/icons/1769408068848-delete.svg	[{"url": "http://127.0.0.1:19000/icons/1769408068848-delete.svg", "name": "delete.svg", "order": 0}]	732	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:14:29.478	2026-04-28 03:29:24.869
cmkelwehb0003qsljevmpvx18	대표이사 3	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/________3_1768430562757_epbx4ksg3v9.png	http://127.0.0.1:19000/posts/character/________3_1768430562757_epbx4ksg3v9.svg	[{"url": "http://127.0.0.1:19000/posts/character/________3_1768430562757_epbx4ksg3v9.svg", "name": "대표이사3.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAOCAMAAAAYGszCAAAABlBMVEXf4eLCw8TBOLDjAAAAAnRSTlM3RnkriakAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA2SURBVHictcvBCgAwCAJQ/f+fHrkCZV0n0eGhwLdQl0JQz4lFYjNx56JnulEbT+r9Y2tznxMHLDsAhMjjNZcAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/________3_1768430562757_epbx4ksg3v9.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	대표이사	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:42:46.987	2026-04-28 03:29:24.877
cmknfeql2000112yt09njl81d	Pretendard 세로	\N	v3.1 , 세로	https://design5.pentasecurity.com/ppt-thumbnails/ppt-cmknfeql2000112yt09njl81d-1775722557456.jpg	http://127.0.0.1:19000/posts/ppt/PPT_Template_KR_vertical_Pretendard_v3_1_1775720225932_mz57u706m9i.pptx	[{"url": "http://127.0.0.1:19000/posts/ppt/PPT_Template_KR_vertical_Pretendard_v3_1_1775720225932_mz57u706m9i.pptx", "name": "PPT_Template_KR_vertical_Pretendard_v3_1_1775720225932_mz57u706m9i.pptx", "order": 0}]	0	image	image/*	cmkdc6dch0007flswqgemr713	PUBLISHED	f	0	0	세로	KR	2026-04-09 00:00:00	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-21 02:51:00.75	2026-04-28 03:29:24.879
cmkf1qn5t00092grf0alig6r5	D.AMO for SAP	\N	\N	https://design5.pentasecurity.com/posts/damo/D_AMO_for_SAP_Brochure_KR_241209_1768457170370_k3z1sxzlpo.pdf	http://127.0.0.1:19000/posts/damo/D_AMO_for_SAP_Brochure_KR_241209_1768457170370_k3z1sxzlpo.pdf	[{"url": "http://127.0.0.1:19000/posts/damo/D_AMO_for_SAP_Brochure_KR_241209_1768457170370_k3z1sxzlpo.pdf", "name": "D.AMO_for_SAP_Brochure_KR_241209.pdf", "order": 0}]	0	image	image/*	cmkdc6dgp000cflsw1k2j57jt	PUBLISHED	f	0	0	D.AMO for SAP	KR	2024-12-08 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:06:12.157	2026-04-28 03:29:24.881
cmkf1sjgd000d2grf5tlvlpq3	D.AMO KE	\N	일문	https://design5.pentasecurity.com/posts/damo/D_AMO_KE_Brochure_JP_250521_1768457258768_459xbwj32fn.pdf	http://127.0.0.1:19000/posts/damo/D_AMO_KE_Brochure_JP_250521_1768457258768_459xbwj32fn.pdf	[{"url": "http://127.0.0.1:19000/posts/damo/D_AMO_KE_Brochure_JP_250521_1768457258768_459xbwj32fn.pdf", "name": "D.AMO KE_Brochure_JP_250521.pdf", "order": 0}]	0	image	image/*	cmkdc6dgp000cflsw1k2j57jt	PUBLISHED	f	0	0	D.AMO KE	JP	2025-05-20 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:07:40.526	2026-04-28 03:29:24.883
cmkelxype0009qslj29zu5a8p	보안사업본부 2	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______________2_1768430636795_8okn2o69ep.png	http://127.0.0.1:19000/posts/character/_______________2_1768430636795_8okn2o69ep.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______________2_1768430636795_8okn2o69ep.svg", "name": "보안사업본부2.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAALCAMAAABI111xAAAAJFBMVEWin6afnqSLjZB/goRtbnCamp50d3mKi49/gYStp651d3pvcXMqwVPvAAAADHRSTlNNWntNl2twY45AXYF7ysjrAAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAT0lEQVR4nE3LQRKAMAhD0UBbU/X+93UgdPAv3yS4MwAYGBUOYdixxCAzknwU0syYWAqZ6Kp0tbVId29MW6I3+5n7liWW7WhGPWwLbBPN+QHVIgQaJUxbSQAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______________2_1768430636795_8okn2o69ep.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:43:59.853	2026-04-28 03:29:24.886
cmkelz5al000fqsljmuz26khm	보안사업본부 5	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______________5_1768430691892_xqe26tlc2ad.png	http://127.0.0.1:19000/posts/character/_______________5_1768430691892_xqe26tlc2ad.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______________5_1768430691892_xqe26tlc2ad.svg", "name": "보안사업본부5.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAACVBMVEVfmbpTkbU3eKTB63UYAAAAA3RSTlMwPk2XtQceAAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAUUlEQVR4nK2OWwoAIAgEXe9/6FjzWfSXgrDDaIn8K1wAEPZwQIyGLU4VYaHUyi/m9IRhqneZqo0khBrnyHWmbbfXHeYN+3pA354mzz7NA5a5AKe7ATjWgFscAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______________5_1768430691892_xqe26tlc2ad.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:44:55.048	2026-04-28 03:29:24.888
cmkem00p8000hqsljmcdxjfpp	인증보안사업본부 2	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_____________________2_1768430732971_mmj41ol6vm.png	http://127.0.0.1:19000/posts/character/_____________________2_1768430732971_mmj41ol6vm.svg	[{"url": "http://127.0.0.1:19000/posts/character/_____________________2_1768430732971_mmj41ol6vm.svg", "name": "인증보안사업본부2.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAPCAMAAADTRh9nAAAABlBMVEWOs82Nssz/UUIKAAAAAnRSTlM9MU2lhbwAAAAJcEhZcwAAD2EAAA9hAag/p2kAAABASURBVHicrc8xDgAgCAPA8v9PG7BIRUcaB7h0QNgODODoS1LECinA6Ugvu4GaLzr76zbQbPgcL80L6+/CglQuC1FhAHzY0Ex/AAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_____________________2_1768430732971_mmj41ol6vm.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인증보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:45:35.751	2026-04-28 03:29:24.89
cmkem1310000nqsljpsu6ahq2	인증보안사업본부 5	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_____________________5_1768430782521_6inli35xsvm.png	http://127.0.0.1:19000/posts/character/_____________________5_1768430782521_6inli35xsvm.svg	[{"url": "http://127.0.0.1:19000/posts/character/_____________________5_1768430782521_6inli35xsvm.svg", "name": "인증보안사업본부5.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAOCAMAAAAYGszCAAAABlBMVEXQ1djGzNBhEmTbAAAAAnRSTlNeTsPP0XUAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA8SURBVHicY2BkZEABjIyMjAzoggxgQUwx0lRi2oSuHaQQrBJDGE07WCFEJVwcyoWRMIisEioBZ2IBWAUBOW0AjfJ5ZBkAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_____________________5_1768430782521_6inli35xsvm.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인증보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:46:25.423	2026-04-28 03:29:24.896
cmojeeiwg0005iv6erv60fgpw	safe	\N	\N	https://design5.pentasecurity.com/icons/1777427435814-safe.svg	http://127.0.0.1:19000/icons/1777427435814-safe.svg	[{"url": "http://127.0.0.1:19000/icons/1777427435814-safe.svg", "name": "safe.svg", "order": 0}]	1160	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-04-29 01:50:35.823	2026-04-29 01:50:35.823
cmkemce3u001bqsljhs669xam	품질관리실 4	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________4_1768431309931_dnyhkp64xxj.png	http://127.0.0.1:19000/posts/character/______________4_1768431309931_dnyhkp64xxj.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________4_1768431309931_dnyhkp64xxj.svg", "name": "품질관리실4.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAARCAMAAADqmnyMAAAADFBMVEVVfJVfiadzmbWHoLTcZSZ6AAAABHRSTlM+SlVH8R6cPAAAAAlwSFlzAAAPYQAAD2EBqD+naQAAAFNJREFUeJx9zUsOwCAQAlCQ+9+5mR+10ZTMxheIkLS2kCSgUxG49CnyaPJE1jrxd57kZnOuB/P7krRu0makpQxQuGlQcK0JimP59FIRL8Obu+55AI35Abo2dXpoAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________4_1768431309931_dnyhkp64xxj.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	품질관리실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:55:12.997	2026-04-28 03:29:24.899
cmkelysny000dqsljtwlqjsz5	보안사업본부 4	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______________4_1768430675645_bgik4k9br4h.png	http://127.0.0.1:19000/posts/character/_______________4_1768430675645_bgik4k9br4h.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______________4_1768430675645_bgik4k9br4h.svg", "name": "보안사업본부4.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAUCAMAAABlGZcgAAAABlBMVEVMg6ZckK3/O33YAAAAAnRSTlM3Kj0vpNoAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA0SURBVHicY2BEBQzU4DMwMjBAZUBMEICJgCmoIEgAIgsFYHkkLhihKkDlowMqy8Ndj1seAG29AHZseNByAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______________4_1768430675645_bgik4k9br4h.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:44:38.654	2026-04-28 03:29:24.901
cmkem0q3l000lqsljsqayz131	인증보안사업본부 4	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_____________________4_1768430765277_61xyk93ec1r.png	http://127.0.0.1:19000/posts/character/_____________________4_1768430765277_61xyk93ec1r.svg	[{"url": "http://127.0.0.1:19000/posts/character/_____________________4_1768430765277_61xyk93ec1r.svg", "name": "인증보안사업본부4.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAQCAMAAAAhxq8pAAAACVBMVEWEs8iBtct8ttDacdvrAAAAA3RSTlNXSTiaPLA5AAAACXBIWXMAAA9hAAAPYQGoP6dpAAAASElEQVR4nG3NQQ4AIQhD0V/vf2gjWHFGYENe2sBohjoVe6Nyhj5olowHUgPjREDqwrKtxhAzfyvcXeubPHgbiCfY11eyrTePJv2aASJcMo5MAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_____________________4_1768430765277_61xyk93ec1r.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인증보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:46:08.674	2026-04-28 03:29:24.903
cmkem1nh1000pqsljl7hroi5a	미래사업본부 2	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________2_1768430809157_sj4dm5smhy.png	http://127.0.0.1:19000/posts/character/______________2_1768430809157_sj4dm5smhy.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________2_1768430809157_sj4dm5smhy.svg", "name": "미래사업본부2.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAUCAMAAAC3SZ14AAAAD1BMVEXSwcDFtba2o6e0r7O2t7vXOFXiAAAABXRSTlMhNEVSY2vkL+wAAAAJcEhZcwAAD2EAAA9hAag/p2kAAABXSURBVHicrYtBDgAhCANpy//fvCmgRs9biEnHIeLvwOPnBQgAxrgSJffnRd8UordHjQh6SUGQoknFXVJMJcUCth5wrA1y0HYyMwftvtBI2fBY4yzrOvwA9QsCQenCKN8AAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________2_1768430809157_sj4dm5smhy.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	미래보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:46:51.92	2026-04-28 03:29:24.905
cmkem1y7e000rqsljsfifyt0s	미래사업본부 3	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________3_1768430822890_m09fru1zwsl.png	http://127.0.0.1:19000/posts/character/______________3_1768430822890_m09fru1zwsl.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________3_1768430822890_m09fru1zwsl.svg", "name": "미래사업본부3.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAQCAMAAAAhxq8pAAAABlBMVEWgoqGnrbPWvXHAAAAAAnRSTlMgLabIte8AAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA4SURBVHicY2CgJWDEJgSB6EJooiARKIALI8RAyjHUQWTAgqhCYEF0hWCl6EIQtZiiWMTAjsAUBAA5jgCbcCdAuQAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________3_1768430822890_m09fru1zwsl.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	미래보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:47:05.668	2026-04-28 03:29:24.908
cmkem35gc000xqsljk5vkxvpm	기획실 1	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/________1_1768430878735_drqbwryh03j.png	http://127.0.0.1:19000/posts/character/________1_1768430878735_drqbwryh03j.svg	[{"url": "http://127.0.0.1:19000/posts/character/________1_1768430878735_drqbwryh03j.svg", "name": "기획실1.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAQCAMAAAAhxq8pAAAABlBMVEWrqazDw8U0BpkTAAAAAnRSTlMpNBNhpmYAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA2SURBVHicY2DEBAwMjMSJMjBgCjKARLEpRBcGK8QuBhKGS6CIgUTBNDKAiKCKgYWxA1ziVAEAihIAjYTqVqwAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/________1_1768430878735_drqbwryh03j.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	기획실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:48:01.88	2026-04-28 03:29:24.916
cmkem9jh70015qsljcje3dc9o	기획실 5	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/________5_1768431176821_byf140r8oi5.png	http://127.0.0.1:19000/posts/character/________5_1768431176821_byf140r8oi5.svg	[{"url": "http://127.0.0.1:19000/posts/character/________5_1768431176821_byf140r8oi5.svg", "name": "기획실5.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAALCAMAAABI111xAAAAD1BMVEW93/Kx1+qt0uXI5fbW7PlRhnIMAAAABXRSTlNeUT9sfIk1pM0AAAAJcEhZcwAAD2EAAA9hAag/p2kAAABASURBVHicbcpBDgAgCAPBAv7/zYYWFBN762SxuIgIwMw8h4MgUoUK3zItsRVFbULRF5NoA2lX6z7hROks7ZL7BsWhAWVidui3AAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/________5_1768431176821_byf140r8oi5.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	기획실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:52:59.971	2026-04-28 03:29:24.918
cmkem97150013qslj9nqvf0wi	기획실 4	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/________4_1768431159869_5420ehontyl.png	http://127.0.0.1:19000/posts/character/________4_1768431159869_5420ehontyl.svg	[{"url": "http://127.0.0.1:19000/posts/character/________4_1768431159869_5420ehontyl.svg", "name": "기획실4.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAUCAMAAABYi/ZGAAAAG1BMVEXM0dTU2NrW2dzR1dfGy8+vtbm6wcXAxsq1vcNBNnlqAAAACXRSTlOhusewkWl1g1RQJzfmAAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAYUlEQVR4nG3KQRLAIAhD0VBEuf+JO4AdQ9u/0PFFXD0REfyZvEUUcV5yRLSMUlVFHJ00rYfoKzsFPQcvm7Ja4orHKuSwotEWzJnKYVaLJphtPcHd3WzykpZ82maszz/+fAPmrAVc9JVMzgAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/________4_1768431159869_5420ehontyl.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	기획실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:52:43.859	2026-04-28 03:29:24.923
cmkemalr20017qsljrgz51smn	품질관리실 2	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________2_1768431225904_a5aadnu1iyb.png	http://127.0.0.1:19000/posts/character/______________2_1768431225904_a5aadnu1iyb.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________2_1768431225904_a5aadnu1iyb.svg", "name": "품질관리실2.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAALCAMAAABI111xAAAABlBMVEWmxuaJyfC2Ava3AAAAAnRSTlMUHEw8RiIAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAuSURBVHicY2AgGTAyMGITQhdmZGAEAWRRqBAEIESRxGCiSGJwpahi2AUhopiCABwcAGMxjURdAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________2_1768431225904_a5aadnu1iyb.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	품질관리실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:53:49.591	2026-04-28 03:29:24.926
cmkeme4wu001hqslj0dubevpm	보안기술연구소 3	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_________________3_1768431390979_qncluuq3vd.png	http://127.0.0.1:19000/posts/character/_________________3_1768431390979_qncluuq3vd.svg	[{"url": "http://127.0.0.1:19000/posts/character/_________________3_1768431390979_qncluuq3vd.svg", "name": "보안기술연구소3.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAMCAMAAABV0m3JAAAABlBMVEV1n7h1pcBvNtOuAAAAAnRSTlNPPsATg1kAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAoSURBVHicY2BkQABGBkYwQBICC2MRhCpFVwkWRROkUCVElLoWQXwEACDmAEJTs127AAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_________________3_1768431390979_qncluuq3vd.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안기술연구소	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:56:34.391	2026-04-28 03:29:24.939
cmkemeld5001jqslj26hu98at	보안기술연구소 4	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_________________4_1768431412903_x3aso7f74j.png	http://127.0.0.1:19000/posts/character/_________________4_1768431412903_x3aso7f74j.svg	[{"url": "http://127.0.0.1:19000/posts/character/_________________4_1768431412903_x3aso7f74j.svg", "name": "보안기술연구소4.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAMCAMAAABV0m3JAAAACVBMVEWNwd2Fv9+Xw9xdUiySAAAAA3RSTlNTZUNj09v/AAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAQElEQVR4nIXNQRIAIAgCQOL/j24EKj1lF1qZEcCaA88fY1MFHBoSHoaUoKt67rEw3dqcGpumaGzsn7EO3vxCjxtVHADXjn2dLAAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_________________4_1768431412903_x3aso7f74j.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안기술연구소	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:56:55.715	2026-04-28 03:29:24.941
cmkemhnqo001xqsljlkx9nff4	재경부 3	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______3_1768431555790_fs64fmx0wz.png	http://127.0.0.1:19000/posts/character/_______3_1768431555790_fs64fmx0wz.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______3_1768431555790_fs64fmx0wz.svg", "name": "재경부3.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAOCAMAAAAYGszCAAAAHlBMVEWdrKqgra6frLOfrLCNo7CQpKKBnKlgh6B9mKJ1lqp9xFt+AAAACnRSTlNicYx+i055gWaMS3S/6AAAAAlwSFlzAAAPYQAAD2EBqD+naQAAAGBJREFUeJxVykEOACEIBEEEBPz/hzcD6GofjCmG6Gp2+A8ar9PYXdsfm+FAORwUEXOSdDhZaRwUMRtmsELGo2BLJmZmYVZV00IPEmhiq4fnskx1reWoUFMXunDTs3yG/gHSqgQhIihneAAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______3_1768431555790_fs64fmx0wz.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	재경부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:59:18.768	2026-04-28 03:29:24.943
cmkemi9aa0021qsljgizmfkg6	재경부 5	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______5_1768431583759_3wllzrnyl2u.png	http://127.0.0.1:19000/posts/character/_______5_1768431583759_3wllzrnyl2u.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______5_1768431583759_3wllzrnyl2u.svg", "name": "재경부5.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAANCAMAAACejr5sAAAACVBMVEV2tcSLtK2Nt7boxB3GAAAAA3RSTlNPVUFHp9Y0AAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAP0lEQVR4nJXMQQ4AIAgDwXb//2gDSjTixR4nCwJdQ4LO+inDLNvygThVm6PMLrc0QspK8/zco5zaS09sDxoZBlUkAM7TELsjAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______5_1768431583759_3wllzrnyl2u.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	재경부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:59:46.691	2026-04-28 03:29:24.945
cmkemfskb001nqslj8aif29s9	인사부 2	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______2_1768431468219_dnfo8resgo6.png	http://127.0.0.1:19000/posts/character/_______2_1768431468219_dnfo8resgo6.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______2_1768431468219_dnfo8resgo6.svg", "name": "인사부2.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAUCAMAAABlGZcgAAAABlBMVEWrxNGtw89ubV2aAAAAAnRSTlNnU65NMBYAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA/SURBVHicY2BEBQzE8xnAACYM4UH5CC6YD+dA+EiyID6yLJiPph5NHlWaCP3o6lFdBHEPQhOaT5H9D1GLGh4AYzYAlfrCYAcAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______2_1768431468219_dnfo8resgo6.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인사부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:57:51.563	2026-04-28 03:29:24.948
cmkemhyfp001zqsljgzppwkhz	재경부 4	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______4_1768431569537_m38tre5kml.png	http://127.0.0.1:19000/posts/character/_______4_1768431569537_m38tre5kml.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______4_1768431569537_m38tre5kml.svg", "name": "재경부4.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAARCAMAAADqmnyMAAAABlBMVEW7w8GyvLoQMNBJAAAAAnRSTlNVQimNRJUAAAAJcEhZcwAAD2EAAA9hAag/p2kAAABASURBVHicjc4BCgAgCAPA+f9Px1SUdEQjCY4JwkQwfg/4AE5AoFvGCpsgsLqDFGZ1GfWr6dWFal3e+WpeHtdLPHIYAIJh+wU2AAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______4_1768431569537_m38tre5kml.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	재경부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:59:32.623	2026-04-28 03:29:24.959
cmkf1rgrc000b2grfqib8ll6o	D.AMO PACS	\N	\N	https://design5.pentasecurity.com/posts/damo/D_AMO_PACS_Brochure_KR_241209_1768457208733_7g74sr3ewna.pdf	http://127.0.0.1:19000/posts/damo/D_AMO_PACS_Brochure_KR_241209_1768457208733_7g74sr3ewna.pdf	[{"url": "http://127.0.0.1:19000/posts/damo/D_AMO_PACS_Brochure_KR_241209_1768457208733_7g74sr3ewna.pdf", "name": "D.AMO_PACS_Brochure_KR_241209.pdf", "order": 0}]	0	image	image/*	cmkdc6dgp000cflsw1k2j57jt	PUBLISHED	f	0	0	D.AMO PACS	KR	2024-12-08 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:06:50.515	2026-04-28 03:29:24.961
cmkdpkdd8000butpi5lpp83vk	재경부 1	\N	\N	https://design5.pentasecurity.com/posts/character/_______1_1768434270390_horttno94fc.svg	http://127.0.0.1:19000/posts/character/_______1_1768434270390_horttno94fc.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______1_1768434270390_horttno94fc.svg", "name": "재경부1.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAPCAMAAADTRh9nAAAAD1BMVEXKzsXJz8vKzL3Jz87Lya+RPmNSAAAABXRSTlNidFGFPbYmcc8AAAAJcEhZcwAAD2EAAA9hAag/p2kAAABISURBVHicVcrHDQAwDMNAuew/cxA32XweCJ1cvQKRDEXU7IGr4Y2jAAQiImT3gIy6MPlrol3FF4uoGLP4G1m9F3u9mKo4VusDRBMCDtGJbgoAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______1_1768434270390_horttno94fc.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	재경부	\N	\N	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-14 07:37:37.957	2026-04-28 03:29:24.963
cmkf2mbxq0005112g8qlmkhwi	iSIGN WA	\N	\N	https://design5.pentasecurity.com/posts/isign/iSIGN_WA_Brochure_KR_241206_1768458648665_rz1g5y8p7da.pdf	http://127.0.0.1:19000/posts/isign/iSIGN_WA_Brochure_KR_241206_1768458648665_rz1g5y8p7da.pdf	[{"url": "http://127.0.0.1:19000/posts/isign/iSIGN_WA_Brochure_KR_241206_1768458648665_rz1g5y8p7da.pdf", "name": "iSIGN_WA_Brochure_KR_241206.pdf", "order": 0}]	0	image	image/*	cmkdc6dhi000dflswuzi033eb	PUBLISHED	f	0	0	iSIGN WA	KR	2024-12-05 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:30:50.563	2026-04-28 03:29:24.965
cmkf2kczn0001112g918naqw9	iSIGN	\N	국문	https://design5.pentasecurity.com/posts/isign/iSIGN_Brochure_KR_250207_1768458556128_pg3jfo183d.pdf	http://127.0.0.1:19000/posts/isign/iSIGN_Brochure_KR_250207_1768458556128_pg3jfo183d.pdf	[{"url": "http://127.0.0.1:19000/posts/isign/iSIGN_Brochure_KR_250207_1768458556128_pg3jfo183d.pdf", "name": "iSIGN_Brochure_KR_250207.pdf", "order": 0}]	0	image	image/*	cmkdc6dhi000dflswuzi033eb	PUBLISHED	f	0	0	iSIGN	KR	2025-02-06 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:29:18.652	2026-04-28 03:29:24.967
cmkf2nbzm0007112ghadg7bbu	iSIGN Endpoint Authentication	\N	\N	https://design5.pentasecurity.com/posts/isign/iSIGN_Endpoint_Authentication_Brochure_KR_241205_1768458695666_h925i24f5vv.pdf	http://127.0.0.1:19000/posts/isign/iSIGN_Endpoint_Authentication_Brochure_KR_241205_1768458695666_h925i24f5vv.pdf	[{"url": "http://127.0.0.1:19000/posts/isign/iSIGN_Endpoint_Authentication_Brochure_KR_241205_1768458695666_h925i24f5vv.pdf", "name": "iSIGN_Endpoint_Authentication_Brochure_KR_241205.pdf", "order": 0}]	0	image	image/*	cmkdc6dhi000dflswuzi033eb	PUBLISHED	f	0	0	iSIGN EA	KR	2025-12-04 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:31:37.323	2026-04-28 03:29:24.97
cmkf2ld0c0003112gszky0b6z	iSIGN PASS	\N	\N	https://design5.pentasecurity.com/posts/isign/iSIGN_PASS_Brochure_KR_241206_1768458602214_uwqewsvta4k.pdf	http://127.0.0.1:19000/posts/isign/iSIGN_PASS_Brochure_KR_241206_1768458602214_uwqewsvta4k.pdf	[{"url": "http://127.0.0.1:19000/posts/isign/iSIGN_PASS_Brochure_KR_241206_1768458602214_uwqewsvta4k.pdf", "name": "iSIGN PASS_Brochure_KR_241206.pdf", "order": 0}]	0	image	image/*	cmkdc6dhi000dflswuzi033eb	PUBLISHED	f	0	0	iSIGN PASS	KR	2024-12-05 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:30:05.333	2026-04-28 03:29:24.977
cmkf2o9pq0009112gj7o5fgkg	iSIGN Password-less	\N	\N	https://design5.pentasecurity.com/posts/isign/iSIGN_Password_less_Brochure_KR_250603_1768458739101_je740m66omd.pdf	http://127.0.0.1:19000/posts/isign/iSIGN_Password_less_Brochure_KR_250603_1768458739101_je740m66omd.pdf	[{"url": "http://127.0.0.1:19000/posts/isign/iSIGN_Password_less_Brochure_KR_250603_1768458739101_je740m66omd.pdf", "name": "iSIGN_Password-less_Brochure_KR_250603.pdf", "order": 0}]	0	image	image/*	cmkdc6dhi000dflswuzi033eb	PUBLISHED	f	0	0	iSIGN PL	KR	2025-06-02 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:32:21.031	2026-04-28 03:29:24.98
cmkf3gv6b0001r1o2chwx8fbo	Cloudbric	\N	제품 종합 소개서, Product Overview	https://design5.pentasecurity.com/posts/cloudbric/Cloudbric_1768460072584_g0eejesxl7q.pdf	http://127.0.0.1:19000/posts/cloudbric/Cloudbric_1768460072584_g0eejesxl7q.pdf	[{"url": "http://127.0.0.1:19000/posts/cloudbric/Cloudbric_1768460072584_g0eejesxl7q.pdf", "name": "Cloudbric.pdf", "order": 0}]	0	image	image/*	cmkdc6dif000eflswndtrdztu	PUBLISHED	f	0	0	Cloudbric	KR	2026-01-05 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:54:35.185	2026-04-28 03:29:24.982
cmkf3igs30005r1o2pg48sypq	Cloudbric WMS	\N	Public Cloud Security	https://design5.pentasecurity.com/posts/cloudbric/Cloudbric_WMS_1768460147939_gsw80aj06m.pdf	http://127.0.0.1:19000/posts/cloudbric/Cloudbric_WMS_1768460147939_gsw80aj06m.pdf	[{"url": "http://127.0.0.1:19000/posts/cloudbric/Cloudbric_WMS_1768460147939_gsw80aj06m.pdf", "name": "Cloudbric_WMS.pdf", "order": 0}]	0	image	image/*	cmkdc6dif000eflswndtrdztu	PUBLISHED	f	0	0	WMS	KR	2025-01-08 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:55:49.87	2026-04-28 03:29:24.986
cmkf01ab30007kiuwjyc4ueks	WAPPLES 6p	\N	WAPPLES DataSheet 6페이지	https://design5.pentasecurity.com/posts/wapples/WAPPLES_DataSheet_EN_6p_260115_1768454306793_h5nll3i20vw.pdf	http://127.0.0.1:19000/posts/wapples/WAPPLES_DataSheet_EN_6p_260115_1768454306793_h5nll3i20vw.pdf	[{"url": "http://127.0.0.1:19000/posts/wapples/WAPPLES_DataSheet_EN_6p_260115_1768454306793_h5nll3i20vw.pdf", "name": "WAPPLES_DataSheet_EN_6p_260115.pdf", "order": 0}]	0	image	image/*	cmkdc6dfw000bflsw1kajwbt2	PUBLISHED	f	0	0	WAPPLES	EN	2026-01-14 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 05:18:29.48	2026-04-28 03:29:24.988
cmmtzc4wh0003bi0pkmvms0lc	2026 펜테콘 Week	연결로 피어나는 기술	\N	https://design5.pentasecurity.com/posts/penta-design/2026_PTC_Week_1080x1920_1773713685795_whwl763uj3q.jpg	http://127.0.0.1:19000/posts/penta-design/2026_PTC_Week_1080x1920_1773713685795_whwl763uj3q.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/2026_PTC_Week_1080x1920_1773713685795_whwl763uj3q.jpg", "name": "2026_PTC Week_1080x1920.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAsDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAIBAwb/xAAYEAEBAQEBAAAAAAAAAAAAAAAAARECEv/EABYBAQEBAAAAAAAAAAAAAAAAAAEAAv/EABYRAQEBAAAAAAAAAAAAAAAAAAABEf/aAAwDAQACEQMRAD8A3OjSWl9I4jqq7QC1H//Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/2026_PTC_Week_1080x1920_1773713685795_whwl763uj3q.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/2026_PTC_Week_1920x1080_1773713690307_n7hktbumwv.jpg", "name": "2026_PTC Week_1920x1080.jpg", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAIBBv/EABcQAQEBAQAAAAAAAAAAAAAAAAABAhL/xAAVAQEBAAAAAAAAAAAAAAAAAAABAP/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBAAIRAxEAPwDuqm1tRok6EURj/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/2026_PTC_Week_1920x1080_1773713690307_n7hktbumwv.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	21	0	\N	\N	2026-02-28 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 02:14:53.389	2026-04-30 00:15:20.029
cmkezsvrl0005kiuw7toeum5y	WAPPLES 2p	\N	WAPPLES DataSheet 2페이지	https://design5.pentasecurity.com/posts/wapples/WAPPLES_DataSheet_EN_2p_260115_1768453914625_ft44e1578w5.pdf	http://127.0.0.1:19000/posts/wapples/WAPPLES_DataSheet_EN_2p_260115_1768453914625_ft44e1578w5.pdf	[{"url": "http://127.0.0.1:19000/posts/wapples/WAPPLES_DataSheet_EN_2p_260115_1768453914625_ft44e1578w5.pdf", "name": "WAPPLES_DataSheet_EN_2p_260115.pdf", "order": 0}]	0	image	image/*	cmkdc6dfw000bflsw1kajwbt2	PUBLISHED	f	0	0	WAPPLES	EN	2026-01-14 15:00:00	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-15 05:11:57.38	2026-04-28 03:29:24.991
cmkf1ohzu00072grf097eaq7f	D.AMO KMS	\N	\N	https://design5.pentasecurity.com/posts/damo/D_AMO_KMS_Brochure_KR_250814_1768457069595_fpp2nxxcbmv.pdf	http://127.0.0.1:19000/posts/damo/D_AMO_KMS_Brochure_KR_250814_1768457069595_fpp2nxxcbmv.pdf	[{"url": "http://127.0.0.1:19000/posts/damo/D_AMO_KMS_Brochure_KR_250814_1768457069595_fpp2nxxcbmv.pdf", "name": "D.AMO_KMS_Brochure_KR_250814.pdf", "order": 0}]	0	image	image/*	cmkdc6dgp000cflsw1k2j57jt	PUBLISHED	f	0	0	D.AMO KMS	KR	2025-08-13 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:04:32.15	2026-04-28 03:29:24.993
cmkf1h41p00012grftwqufhxu	D.AMO	\N	\N	https://design5.pentasecurity.com/posts/damo/D_AMO_Brochure_KR_250814_1768456725134_754iek0lg2n.pdf	http://127.0.0.1:19000/posts/damo/D_AMO_Brochure_KR_250814_1768456725134_754iek0lg2n.pdf	[{"url": "http://127.0.0.1:19000/posts/damo/D_AMO_Brochure_KR_250814_1768456725134_754iek0lg2n.pdf", "name": "D.AMO_Brochure_KR_250814.pdf", "order": 0}]	0	image	image/*	cmkdc6dgp000cflsw1k2j57jt	PUBLISHED	f	0	0	D.AMO	KR	2025-08-13 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 05:58:47.48	2026-04-28 03:29:24.995
cmkf1j6oj00032grfh0h2t3lx	D.AMO 2p	\N	런던 전시회용 	https://design5.pentasecurity.com/posts/damo/D_AMO_DataSheet_EN_2p_260115_1768456931713_uxa1w1p4kpk.pdf	http://127.0.0.1:19000/posts/damo/D_AMO_DataSheet_EN_2p_260115_1768456931713_uxa1w1p4kpk.pdf	[{"url": "http://127.0.0.1:19000/posts/damo/D_AMO_DataSheet_EN_2p_260115_1768456931713_uxa1w1p4kpk.pdf", "name": "D.AMO_DataSheet_EN_2p_260115.pdf", "order": 0}]	0	image	image/*	cmkdc6dgp000cflsw1k2j57jt	PUBLISHED	f	0	0	D.AMO	EN	2026-01-14 15:00:00	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-15 06:00:24.206	2026-04-28 03:29:24.997
cmkf040al0009kiuwwj4xlmws	WAPPLES SA	\N	일문, 주소 영역에 Gartner 라이선스 내용 추가 	https://design5.pentasecurity.com/posts/wapples/WAPPLES_SA_Brochure_JP_251104_1768454434063_ystcsqdjt5o.pdf	http://127.0.0.1:19000/posts/wapples/WAPPLES_SA_Brochure_JP_251104_1768454434063_ystcsqdjt5o.pdf	[{"url": "http://127.0.0.1:19000/posts/wapples/WAPPLES_SA_Brochure_JP_251104_1768454434063_ystcsqdjt5o.pdf", "name": "WAPPLES_SA_Brochure_JP_251104.pdf", "order": 0}]	0	image	image/*	cmkdc6dfw000bflsw1kajwbt2	PUBLISHED	f	0	0	WAPPLES SA	JP	2025-11-03 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 05:20:36.47	2026-04-28 03:29:25
cmkf06f5k000bkiuwiv9wez08	WAPPLES Cloud 2p	\N	영문 DataSheet	https://design5.pentasecurity.com/posts/wapples/WAPPLES_Cloud_DataSheet_EN_2p_250410_1768454547240_72mc97wwhqh.pdf	http://127.0.0.1:19000/posts/wapples/WAPPLES_Cloud_DataSheet_EN_2p_250410_1768454547240_72mc97wwhqh.pdf	[{"url": "http://127.0.0.1:19000/posts/wapples/WAPPLES_Cloud_DataSheet_EN_2p_250410_1768454547240_72mc97wwhqh.pdf", "name": "WAPPLES_Cloud_DataSheet_EN_2p_250410.pdf", "order": 0}]	0	image	image/*	cmkdc6dfw000bflsw1kajwbt2	PUBLISHED	f	0	0	WAPPLES Cloud	EN	2025-04-09 15:00:00	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-15 05:22:29.041	2026-04-28 03:29:25.002
cmkna7rqf00012ht1cjswmpey	Calibri 영문	\N	v3.1 , 16:9	https://design5.pentasecurity.com/ppt-thumbnails/ppt-cmkna7rqf00012ht1cjswmpey-1775720481400.jpg	http://127.0.0.1:19000/posts/ppt/PPT_Template_EN_Calibri_v3_1_1775720478290_atz1h22zxu.pptx	[{"url": "http://127.0.0.1:19000/posts/ppt/PPT_Template_EN_Calibri_v3_1_1775720478290_atz1h22zxu.pptx", "name": "PPT_Template_EN_Calibri_v3.1.pptx", "order": 0}]	0	image	image/*	cmkdc6dch0007flswqgemr713	PUBLISHED	f	0	0	가로	EN	2026-04-09 00:00:00	cmkdc777200001251hxs59lzx	cmkw65m0400007y0ic9c0hnjk	2026-01-21 00:25:37.569	2026-04-28 03:29:25.014
cmkn9snmn0003b1ifb4vesqi3	Pretendard 영문	\N	v3.1 , 16:9	https://design5.pentasecurity.com/ppt-thumbnails/ppt-cmkn9snmn0003b1ifb4vesqi3-1775720511583.jpg	http://127.0.0.1:19000/posts/ppt/PPT_Template_EN_Pretendard_v3_1_1775720508419_867m1hbcwwn.pptx	[{"url": "http://127.0.0.1:19000/posts/ppt/PPT_Template_EN_Pretendard_v3_1_1775720508419_867m1hbcwwn.pptx", "name": "PPT_Template_EN_Pretendard_v3.1.pptx", "order": 0}]	0	image	image/*	cmkdc6dch0007flswqgemr713	PUBLISHED	f	0	0	가로	EN	2026-04-09 00:00:00	cmkdc777200001251hxs59lzx	cmkw65m0400007y0ic9c0hnjk	2026-01-21 00:13:52.288	2026-04-28 03:29:25.016
cmkgktibl000341t8fmgq5r8a	Pretendard 4x3	\N	v3.1, 4:3 	https://design5.pentasecurity.com/ppt-thumbnails/ppt-cmkgktibl000341t8fmgq5r8a-1775720542198.jpg	http://127.0.0.1:19000/posts/ppt/PPT_Template_4x3_KR_Pretendard_v3_1_1775720539290_v6g3n9nib3d.pptx	[{"url": "http://127.0.0.1:19000/posts/ppt/PPT_Template_4x3_KR_Pretendard_v3_1_1775720539290_v6g3n9nib3d.pptx", "name": "PPT_Template_4x3_KR_Pretendard_v3.1.pptx", "order": 0}]	0	image	image/*	cmkdc6dch0007flswqgemr713	PUBLISHED	f	0	0	가로	KR	2026-04-09 00:00:00	cmkdc777200001251hxs59lzx	cmkw65m0400007y0ic9c0hnjk	2026-01-16 07:48:04.732	2026-04-28 03:29:25.018
cmknaus6r000512sum48qul85	Pretendard 국문	\N	v3.1, 16:9	https://design5.pentasecurity.com/ppt-thumbnails/ppt-cmknaus6r000512sum48qul85-1775720385445.jpg	http://127.0.0.1:19000/posts/ppt/PPT_Template_KR_Pretendard_v3_1_1775720382046_79whp3xxbct.pptx	[{"url": "http://127.0.0.1:19000/posts/ppt/PPT_Template_KR_Pretendard_v3_1_1775720382046_79whp3xxbct.pptx", "name": "PPT_Template_KR_Pretendard_v3.1.pptx", "order": 0}]	0	image	image/*	cmkdc6dch0007flswqgemr713	PUBLISHED	f	0	0	가로	KR	2026-04-09 00:00:00	cmkdc777200001251hxs59lzx	cmkw65m0400007y0ic9c0hnjk	2026-01-21 00:43:31.246	2026-04-28 03:29:25.021
cmkq1s3qz000nsykcq14lues2	ethereum	\N	\N	https://design5.pentasecurity.com/icons/1769122368162-ethereum.svg	http://127.0.0.1:19000/icons/1769122368162-ethereum.svg	[{"url": "http://127.0.0.1:19000/icons/1769122368162-ethereum.svg", "name": "ethereum.svg", "order": 0}]	595	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:52:48.252	2026-04-28 03:29:25.023
cmkq1s3mc000lsykc6f8742gw	dollar	\N	\N	https://design5.pentasecurity.com/icons/1769122367979-dollar.svg	http://127.0.0.1:19000/icons/1769122367979-dollar.svg	[{"url": "http://127.0.0.1:19000/icons/1769122367979-dollar.svg", "name": "dollar.svg", "order": 0}]	746	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:52:48.078	2026-04-28 03:29:25.025
cmkqftj6l000d2fao73ldvxnc	home-cam	\N	\N	https://design5.pentasecurity.com/icons/1769145948814-home-cam.svg	http://127.0.0.1:19000/icons/1769145948814-home-cam.svg	[{"url": "http://127.0.0.1:19000/icons/1769145948814-home-cam.svg", "name": "home-cam.svg", "order": 0}]	701	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:25:49.533	2026-04-28 03:29:25.027
cmkq1s3w4000psykcnfk6u2uh	graph	\N	\N	https://design5.pentasecurity.com/icons/1769122368326-graph.svg	http://127.0.0.1:19000/icons/1769122368326-graph.svg	[{"url": "http://127.0.0.1:19000/icons/1769122368326-graph.svg", "name": "graph.svg", "order": 0}]	638	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:52:48.436	2026-04-28 03:29:25.029
cmkq1u3ay000zsykcgr9rlfhy	yen	\N	\N	https://design5.pentasecurity.com/icons/1769122460886-yen.svg	http://127.0.0.1:19000/icons/1769122460886-yen.svg	[{"url": "http://127.0.0.1:19000/icons/1769122460886-yen.svg", "name": "yen.svg", "order": 0}]	703	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:54:20.987	2026-04-28 03:29:25.043
cmkq1u3gf0011sykcbr860nqz	yuan-note	\N	\N	https://design5.pentasecurity.com/icons/1769122461052-yuan-note.svg	http://127.0.0.1:19000/icons/1769122461052-yuan-note.svg	[{"url": "http://127.0.0.1:19000/icons/1769122461052-yuan-note.svg", "name": "yuan-note.svg", "order": 0}]	1096	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:54:21.183	2026-04-28 03:29:25.045
cmkq1jvik0005sykcgda1u5yl	amo_token	\N	\N	https://design5.pentasecurity.com/icons/1769121984184-amo_token.svg	http://127.0.0.1:19000/icons/1769121984184-amo_token.svg	[{"url": "http://127.0.0.1:19000/icons/1769121984184-amo_token.svg", "name": "amo_token.svg", "order": 0}]	971	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-22 22:46:24.323	2026-04-28 03:29:25.047
cmkqftmt8000h2faooj7d2ggn	life	\N	\N	https://design5.pentasecurity.com/icons/1769145953923-life.svg	http://127.0.0.1:19000/icons/1769145953923-life.svg	[{"url": "http://127.0.0.1:19000/icons/1769145953923-life.svg", "name": "life.svg", "order": 0}]	1485	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:25:54.236	2026-04-28 03:29:25.051
cmkqftom9000j2faos7gscigs	light	\N	\N	https://design5.pentasecurity.com/icons/1769145956257-light.svg	http://127.0.0.1:19000/icons/1769145956257-light.svg	[{"url": "http://127.0.0.1:19000/icons/1769145956257-light.svg", "name": "light.svg", "order": 0}]	615	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:25:56.578	2026-04-28 03:29:25.053
cmkqg1bus0001ucusqsasp7su	power-plant	\N	\N	https://design5.pentasecurity.com/icons/1769146312684-power-plant.svg	http://127.0.0.1:19000/icons/1769146312684-power-plant.svg	[{"url": "http://127.0.0.1:19000/icons/1769146312684-power-plant.svg", "name": "power-plant.svg", "order": 0}]	909	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:31:53.109	2026-04-28 03:29:25.055
cmkqg1j830009ucushgeg7iik	x-ray	\N	\N	https://design5.pentasecurity.com/icons/1769146322421-x-ray.svg	http://127.0.0.1:19000/icons/1769146322421-x-ray.svg	[{"url": "http://127.0.0.1:19000/icons/1769146322421-x-ray.svg", "name": "x-ray.svg", "order": 0}]	939	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:32:02.836	2026-04-28 03:29:25.062
cmkqh2ibr0001kt0yo2prbjxx	company-gate	\N	\N	https://design5.pentasecurity.com/icons/1769148047082-company-gate.svg	http://127.0.0.1:19000/icons/1769148047082-company-gate.svg	[{"url": "http://127.0.0.1:19000/icons/1769148047082-company-gate.svg", "name": "company-gate.svg", "order": 0}]	714	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:00:47.76	2026-04-28 03:29:25.064
cmkqh2k4y0003kt0yurxsswis	fingerprint-recognition	\N	\N	https://design5.pentasecurity.com/icons/1769148049966-fingerprint-recognition.svg	http://127.0.0.1:19000/icons/1769148049966-fingerprint-recognition.svg	[{"url": "http://127.0.0.1:19000/icons/1769148049966-fingerprint-recognition.svg", "name": "fingerprint-recognition.svg", "order": 0}]	1192	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:00:50.29	2026-04-28 03:29:25.066
cmkqef2h90001ko4ltp6j38vq	bag	\N	\N	https://design5.pentasecurity.com/icons/1769143594338-bag.svg	http://127.0.0.1:19000/icons/1769143594338-bag.svg	[{"url": "http://127.0.0.1:19000/icons/1769143594338-bag.svg", "name": "bag.svg", "order": 0}]	690	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 04:46:34.902	2026-04-28 03:29:25.071
cmkqefhdn0003ko4lwopzz6fh	home	\N	\N	https://design5.pentasecurity.com/icons/1769143613431-home.svg	http://127.0.0.1:19000/icons/1769143613431-home.svg	[{"url": "http://127.0.0.1:19000/icons/1769143613431-home.svg", "name": "home.svg", "order": 0}]	546	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 04:46:54.212	2026-04-28 03:29:25.075
cmkqegv9a0005ko4l1dd2v63z	vr	\N	\N	https://design5.pentasecurity.com/icons/1769143678122-vr.svg	http://127.0.0.1:19000/icons/1769143678122-vr.svg	[{"url": "http://127.0.0.1:19000/icons/1769143678122-vr.svg", "name": "vr.svg", "order": 0}]	778	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 04:47:58.855	2026-04-28 03:29:25.077
cmkqembur000113fr6ghnq8ga	refrigerator	\N	\N	https://design5.pentasecurity.com/icons/1769143933188-refrigerator.svg	http://127.0.0.1:19000/icons/1769143933188-refrigerator.svg	[{"url": "http://127.0.0.1:19000/icons/1769143933188-refrigerator.svg", "name": "refrigerator.svg", "order": 0}]	628	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 04:52:13.638	2026-04-28 03:29:25.079
cmkqeme25000313frypc8cho6	tv	\N	\N	https://design5.pentasecurity.com/icons/1769143935911-tv.svg	http://127.0.0.1:19000/icons/1769143935911-tv.svg	[{"url": "http://127.0.0.1:19000/icons/1769143935911-tv.svg", "name": "tv.svg", "order": 0}]	899	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 04:52:16.685	2026-04-28 03:29:25.081
cmkqerv76000713fr29dgytfq	washer	\N	\N	https://design5.pentasecurity.com/icons/1769144191422-washer.svg	http://127.0.0.1:19000/icons/1769144191422-washer.svg	[{"url": "http://127.0.0.1:19000/icons/1769144191422-washer.svg", "name": "washer.svg", "order": 0}]	763	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 04:56:32.178	2026-04-28 03:29:25.083
cmkqhs7f30001ye163cin7s20	add	\N	\N	https://design5.pentasecurity.com/icons/1769149244440-add.svg	http://127.0.0.1:19000/icons/1769149244440-add.svg	[{"url": "http://127.0.0.1:19000/icons/1769149244440-add.svg", "name": "add.svg", "order": 0}]	479	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:20:45.588	2026-04-28 03:29:25.096
cmkqhs9jm0003ye16k9wtuv7n	arrow-left	\N	\N	https://design5.pentasecurity.com/icons/1769149248865-arrow-left.svg	http://127.0.0.1:19000/icons/1769149248865-arrow-left.svg	[{"url": "http://127.0.0.1:19000/icons/1769149248865-arrow-left.svg", "name": "arrow-left.svg", "order": 0}]	464	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:20:49.619	2026-04-28 03:29:25.098
cmkqhsbbg0005ye16sgmpf1v2	arrow-right	\N	\N	https://design5.pentasecurity.com/icons/1769149251592-arrow-right.svg	http://127.0.0.1:19000/icons/1769149251592-arrow-right.svg	[{"url": "http://127.0.0.1:19000/icons/1769149251592-arrow-right.svg", "name": "arrow-right.svg", "order": 0}]	463	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:20:51.916	2026-04-28 03:29:25.099
cmkqhsd350007ye16z8o96nj6	check	\N	\N	https://design5.pentasecurity.com/icons/1769149253904-check.svg	http://127.0.0.1:19000/icons/1769149253904-check.svg	[{"url": "http://127.0.0.1:19000/icons/1769149253904-check.svg", "name": "check.svg", "order": 0}]	607	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:20:54.21	2026-04-28 03:29:25.101
cmkqhseud0009ye16qgt732b0	close	\N	\N	https://design5.pentasecurity.com/icons/1769149256183-close.svg	http://127.0.0.1:19000/icons/1769149256183-close.svg	[{"url": "http://127.0.0.1:19000/icons/1769149256183-close.svg", "name": "close.svg", "order": 0}]	485	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:20:56.486	2026-04-28 03:29:25.103
cmkqhsusk0001dks13rmh4d8r	help	\N	\N	https://design5.pentasecurity.com/icons/1769149275219-help.svg	http://127.0.0.1:19000/icons/1769149275219-help.svg	[{"url": "http://127.0.0.1:19000/icons/1769149275219-help.svg", "name": "help.svg", "order": 0}]	837	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:21:17.153	2026-04-28 03:29:25.105
cmkqhswkm0003dks18x1y65ua	image	\N	\N	https://design5.pentasecurity.com/icons/1769149279105-image.svg	http://127.0.0.1:19000/icons/1769149279105-image.svg	[{"url": "http://127.0.0.1:19000/icons/1769149279105-image.svg", "name": "image.svg", "order": 0}]	624	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:21:19.463	2026-04-28 03:29:25.107
cmkqhsybj0005dks1rx61aeme	list-1	\N	\N	https://design5.pentasecurity.com/icons/1769149281411-list-1.svg	http://127.0.0.1:19000/icons/1769149281411-list-1.svg	[{"url": "http://127.0.0.1:19000/icons/1769149281411-list-1.svg", "name": "list-1.svg", "order": 0}]	933	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:21:21.728	2026-04-28 03:29:25.11
cmkqht04f0007dks1wrtny3qd	list-2	\N	\N	https://design5.pentasecurity.com/icons/1769149283680-list-2.svg	http://127.0.0.1:19000/icons/1769149283680-list-2.svg	[{"url": "http://127.0.0.1:19000/icons/1769149283680-list-2.svg", "name": "list-2.svg", "order": 0}]	580	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:21:24.063	2026-04-28 03:29:25.112
cmkqhte14000bdks1kp9ist40	settings	\N	\N	https://design5.pentasecurity.com/icons/1769149301761-settings.svg	http://127.0.0.1:19000/icons/1769149301761-settings.svg	[{"url": "http://127.0.0.1:19000/icons/1769149301761-settings.svg", "name": "settings.svg", "order": 0}]	1675	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 06:21:42.088	2026-04-28 03:29:25.114
cmkusgfc0000jy5pv39leesmk	charging	\N	\N	https://design5.pentasecurity.com/icons/1769409037600-charging.svg	http://127.0.0.1:19000/icons/1769409037600-charging.svg	[{"url": "http://127.0.0.1:19000/icons/1769409037600-charging.svg", "name": "charging.svg", "order": 0}]	693	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:30:37.728	2026-04-28 03:29:25.127
cmkusgfha000ly5pv6t5ii71x	control-settings	\N	\N	https://design5.pentasecurity.com/icons/1769409037811-control-settings.svg	http://127.0.0.1:19000/icons/1769409037811-control-settings.svg	[{"url": "http://127.0.0.1:19000/icons/1769409037811-control-settings.svg", "name": "control-settings.svg", "order": 0}]	829	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:30:37.918	2026-04-28 03:29:25.131
cmkusgfmn000ny5pvnox4mf50	hiding	\N	\N	https://design5.pentasecurity.com/icons/1769409038007-hiding.svg	http://127.0.0.1:19000/icons/1769409038007-hiding.svg	[{"url": "http://127.0.0.1:19000/icons/1769409038007-hiding.svg", "name": "hiding.svg", "order": 0}]	695	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:30:38.111	2026-04-28 03:29:25.133
cmkusuui3000ry5pvpx27ipa9	notification	\N	\N	https://design5.pentasecurity.com/icons/1769409710437-notification.svg	http://127.0.0.1:19000/icons/1769409710437-notification.svg	[{"url": "http://127.0.0.1:19000/icons/1769409710437-notification.svg", "name": "notification.svg", "order": 0}]	771	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:41:50.571	2026-04-28 03:29:25.135
cmkusuun8000ty5pvt90z9cgy	writing-1	\N	\N	https://design5.pentasecurity.com/icons/1769409710649-writing-1.svg	http://127.0.0.1:19000/icons/1769409710649-writing-1.svg	[{"url": "http://127.0.0.1:19000/icons/1769409710649-writing-1.svg", "name": "writing-1.svg", "order": 0}]	544	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:41:50.756	2026-04-28 03:29:25.138
cmkusuush000vy5pvznh0gmdk	writing-2	\N	\N	https://design5.pentasecurity.com/icons/1769409710828-writing-2.svg	http://127.0.0.1:19000/icons/1769409710828-writing-2.svg	[{"url": "http://127.0.0.1:19000/icons/1769409710828-writing-2.svg", "name": "writing-2.svg", "order": 0}]	647	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:41:50.945	2026-04-28 03:29:25.14
cmlg3nw9j000jjlxpakb6stgp	finger	\N	\N	https://design5.pentasecurity.com/icons/1770697651588-finger.svg	http://127.0.0.1:19000/icons/1770697651588-finger.svg	[{"url": "http://127.0.0.1:19000/icons/1770697651588-finger.svg", "name": "finger.svg", "order": 0}]	895	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:31.732	2026-04-28 03:29:25.142
cmlg3nwer000ljlxpedcngclv	folder1	\N	\N	https://design5.pentasecurity.com/icons/1770697651774-folder1.svg	http://127.0.0.1:19000/icons/1770697651774-folder1.svg	[{"url": "http://127.0.0.1:19000/icons/1770697651774-folder1.svg", "name": "folder1.svg", "order": 0}]	479	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:31.923	2026-04-28 03:29:25.144
cmkdfp66s001713ve4js3m2j6	D.AMO BA	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_BA_b_1768359683050_vo5kf4yy7hq.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_BA_b_1768359683050_vo5kf4yy7hq.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_BA_b_1768359683050_vo5kf4yy7hq.svg", "name": "D.AMO BA_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMsIprC53IAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAeSURBVHicY2CAA0YGRihAiDHAxZAEGRFKkVXCtQMABXEAJPg1eREAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_BA_b_1768359683050_vo5kf4yy7hq.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:01:25.78	2026-04-28 03:29:25.146
cmlg3nwwc000rjlxpiow1coxq	hart	\N	\N	https://design5.pentasecurity.com/icons/1770697652420-hart.svg	http://127.0.0.1:19000/icons/1770697652420-hart.svg	[{"url": "http://127.0.0.1:19000/icons/1770697652420-hart.svg", "name": "hart.svg", "order": 0}]	702	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:32.557	2026-04-28 03:29:25.167
cmlg3oayn000tjlxpoiytlr5d	inquiry	\N	\N	https://design5.pentasecurity.com/icons/1770697670630-inquiry.svg	http://127.0.0.1:19000/icons/1770697670630-inquiry.svg	[{"url": "http://127.0.0.1:19000/icons/1770697670630-inquiry.svg", "name": "inquiry.svg", "order": 0}]	610	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:50.779	2026-04-28 03:29:25.169
cmlg3ob3a000vjlxp5lmbehxe	items	\N	\N	https://design5.pentasecurity.com/icons/1770697670826-items.svg	http://127.0.0.1:19000/icons/1770697670826-items.svg	[{"url": "http://127.0.0.1:19000/icons/1770697670826-items.svg", "name": "items.svg", "order": 0}]	1052	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:50.95	2026-04-28 03:29:25.171
cmlg3ob7c000xjlxppnc4cezo	labtop	\N	\N	https://design5.pentasecurity.com/icons/1770697670988-labtop.svg	http://127.0.0.1:19000/icons/1770697670988-labtop.svg	[{"url": "http://127.0.0.1:19000/icons/1770697670988-labtop.svg", "name": "labtop.svg", "order": 0}]	636	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:51.097	2026-04-28 03:29:25.174
cmlg3obbs000zjlxpycykwttk	like	\N	\N	https://design5.pentasecurity.com/icons/1770697671135-like.svg	http://127.0.0.1:19000/icons/1770697671135-like.svg	[{"url": "http://127.0.0.1:19000/icons/1770697671135-like.svg", "name": "like.svg", "order": 0}]	887	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:51.256	2026-04-28 03:29:25.176
cmlg3ooym0017jlxpy4an6v2z	phone	\N	\N	https://design5.pentasecurity.com/icons/1770697688800-phone.svg	http://127.0.0.1:19000/icons/1770697688800-phone.svg	[{"url": "http://127.0.0.1:19000/icons/1770697688800-phone.svg", "name": "phone.svg", "order": 0}]	786	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:08.926	2026-04-28 03:29:25.192
cmlg3op2x0019jlxp4euikkos	position	\N	\N	https://design5.pentasecurity.com/icons/1770697688964-position.svg	http://127.0.0.1:19000/icons/1770697688964-position.svg	[{"url": "http://127.0.0.1:19000/icons/1770697688964-position.svg", "name": "position.svg", "order": 0}]	590	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:09.082	2026-04-28 03:29:25.194
cmlg3pc8c000fvhm358es3zgd	user	\N	\N	https://design5.pentasecurity.com/icons/1770697718954-user.svg	http://127.0.0.1:19000/icons/1770697718954-user.svg	[{"url": "http://127.0.0.1:19000/icons/1770697718954-user.svg", "name": "user.svg", "order": 0}]	572	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:39.084	2026-04-28 03:29:25.196
cmlg3oyzo0001vhm3669ah50p	smart-watch	\N	\N	https://design5.pentasecurity.com/icons/1770697701666-smart-watch.svg	http://127.0.0.1:19000/icons/1770697701666-smart-watch.svg	[{"url": "http://127.0.0.1:19000/icons/1770697701666-smart-watch.svg", "name": "smart-watch.svg", "order": 0}]	958	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:21.922	2026-04-28 03:29:25.198
cmlg3ozd10007vhm3ck4b26dj	star	\N	\N	https://design5.pentasecurity.com/icons/1770697702281-star.svg	http://127.0.0.1:19000/icons/1770697702281-star.svg	[{"url": "http://127.0.0.1:19000/icons/1770697702281-star.svg", "name": "star.svg", "order": 0}]	526	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:22.405	2026-04-28 03:29:25.205
cmlg3pbwa0009vhm34q1u5a9r	tablet	\N	\N	https://design5.pentasecurity.com/icons/1770697718500-tablet.svg	http://127.0.0.1:19000/icons/1770697718500-tablet.svg	[{"url": "http://127.0.0.1:19000/icons/1770697718500-tablet.svg", "name": "tablet.svg", "order": 0}]	527	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:38.648	2026-04-28 03:29:25.207
cmlg3pc0c000bvhm3euqnw73g	user-add	\N	\N	https://design5.pentasecurity.com/icons/1770697718671-user-add.svg	http://127.0.0.1:19000/icons/1770697718671-user-add.svg	[{"url": "http://127.0.0.1:19000/icons/1770697718671-user-add.svg", "name": "user-add.svg", "order": 0}]	823	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:38.797	2026-04-28 03:29:25.209
cmlg3pc45000dvhm305jw5bga	user-search	\N	\N	https://design5.pentasecurity.com/icons/1770697718817-user-search.svg	http://127.0.0.1:19000/icons/1770697718817-user-search.svg	[{"url": "http://127.0.0.1:19000/icons/1770697718817-user-search.svg", "name": "user-search.svg", "order": 0}]	956	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:38.933	2026-04-28 03:29:25.21
cmlg3pcc8000hvhm38yvmkswx	visitors	\N	\N	https://design5.pentasecurity.com/icons/1770697719105-visitors.svg	http://127.0.0.1:19000/icons/1770697719105-visitors.svg	[{"url": "http://127.0.0.1:19000/icons/1770697719105-visitors.svg", "name": "visitors.svg", "order": 0}]	831	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:39.224	2026-04-28 03:29:25.212
cmlg3pcgs000jvhm37dq6yutg	wifi	\N	\N	https://design5.pentasecurity.com/icons/1770697719245-wifi.svg	http://127.0.0.1:19000/icons/1770697719245-wifi.svg	[{"url": "http://127.0.0.1:19000/icons/1770697719245-wifi.svg", "name": "wifi.svg", "order": 0}]	734	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:39.388	2026-04-28 03:29:25.214
cmlg41rb100011262gbf7e9aa	apple	\N	\N	https://design5.pentasecurity.com/icons/1770698297844-apple.svg	http://127.0.0.1:19000/icons/1770698297844-apple.svg	[{"url": "http://127.0.0.1:19000/icons/1770698297844-apple.svg", "name": "apple.svg", "order": 0}]	1182	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:38:18.47	2026-04-28 03:29:25.216
cmlg64y8e00034l8t0wzadfu1	backbone-switch	\N	\N	https://design5.pentasecurity.com/icons/1770701806546-backbone-switch.svg	http://127.0.0.1:19000/icons/1770701806546-backbone-switch.svg	[{"url": "http://127.0.0.1:19000/icons/1770701806546-backbone-switch.svg", "name": "backbone-switch.svg", "order": 0}]	1394	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:36:46.67	2026-04-28 03:29:25.218
cmlg64ycm00054l8t6h5oltcd	block-chain	\N	\N	https://design5.pentasecurity.com/icons/1770701806690-block-chain.svg	http://127.0.0.1:19000/icons/1770701806690-block-chain.svg	[{"url": "http://127.0.0.1:19000/icons/1770701806690-block-chain.svg", "name": "block-chain.svg", "order": 0}]	2131	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:36:46.822	2026-04-28 03:29:25.22
cmlg64ygg00074l8t45bkxm4s	cloud-archive	\N	\N	https://design5.pentasecurity.com/icons/1770701806839-cloud-archive.svg	http://127.0.0.1:19000/icons/1770701806839-cloud-archive.svg	[{"url": "http://127.0.0.1:19000/icons/1770701806839-cloud-archive.svg", "name": "cloud-archive.svg", "order": 0}]	737	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:36:46.96	2026-04-28 03:29:25.222
cmlg64yjl00094l8tt6wk7da7	cloud-backup	\N	\N	https://design5.pentasecurity.com/icons/1770701806977-cloud-backup.svg	http://127.0.0.1:19000/icons/1770701806977-cloud-backup.svg	[{"url": "http://127.0.0.1:19000/icons/1770701806977-cloud-backup.svg", "name": "cloud-backup.svg", "order": 0}]	843	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:36:47.073	2026-04-28 03:29:25.224
cmlg64yn0000b4l8t6rhg6lbm	cloud-sync	\N	\N	https://design5.pentasecurity.com/icons/1770701807089-cloud-sync.svg	http://127.0.0.1:19000/icons/1770701807089-cloud-sync.svg	[{"url": "http://127.0.0.1:19000/icons/1770701807089-cloud-sync.svg", "name": "cloud-sync.svg", "order": 0}]	1078	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:36:47.196	2026-04-28 03:29:25.226
cmlg3nhwr000djlxpr1htayqs	desktop	\N	\N	https://design5.pentasecurity.com/icons/1770697633001-desktop.svg	http://127.0.0.1:19000/icons/1770697633001-desktop.svg	[{"url": "http://127.0.0.1:19000/icons/1770697633001-desktop.svg", "name": "desktop.svg", "order": 0}]	693	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:13.132	2026-04-28 03:29:25.249
cmlg3ni48000fjlxpu4sl5afd	documentation	\N	\N	https://design5.pentasecurity.com/icons/1770697633174-documentation.svg	http://127.0.0.1:19000/icons/1770697633174-documentation.svg	[{"url": "http://127.0.0.1:19000/icons/1770697633174-documentation.svg", "name": "documentation.svg", "order": 0}]	544	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:13.401	2026-04-28 03:29:25.252
cmlg3ni8d000hjlxpfjotrhr2	explorer	\N	\N	https://design5.pentasecurity.com/icons/1770697633437-explorer.svg	http://127.0.0.1:19000/icons/1770697633437-explorer.svg	[{"url": "http://127.0.0.1:19000/icons/1770697633437-explorer.svg", "name": "explorer.svg", "order": 0}]	521	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:27:13.549	2026-04-28 03:29:25.254
cmlg65gfs0001wkjbtmb46o43	db-encryption	\N	\N	https://design5.pentasecurity.com/icons/1770701830011-db-encryption.svg	http://127.0.0.1:19000/icons/1770701830011-db-encryption.svg	[{"url": "http://127.0.0.1:19000/icons/1770701830011-db-encryption.svg", "name": "db-encryption.svg", "order": 0}]	1243	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:10.261	2026-04-28 03:29:25.256
cmlg65gkb0003wkjbkqvktm10	db-server	\N	\N	https://design5.pentasecurity.com/icons/1770701830301-db-server.svg	http://127.0.0.1:19000/icons/1770701830301-db-server.svg	[{"url": "http://127.0.0.1:19000/icons/1770701830301-db-server.svg", "name": "db-server.svg", "order": 0}]	1504	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:10.428	2026-04-28 03:29:25.258
cmlg65sy9000hwkjbz8f8qwfn	encryption2	\N	\N	https://design5.pentasecurity.com/icons/1770701846342-encryption2.svg	http://127.0.0.1:19000/icons/1770701846342-encryption2.svg	[{"url": "http://127.0.0.1:19000/icons/1770701846342-encryption2.svg", "name": "encryption2.svg", "order": 0}]	554	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:26.482	2026-04-28 03:29:25.268
cmlg65t2y000jwkjb4z2worfr	firewall	\N	\N	https://design5.pentasecurity.com/icons/1770701846507-firewall.svg	http://127.0.0.1:19000/icons/1770701846507-firewall.svg	[{"url": "http://127.0.0.1:19000/icons/1770701846507-firewall.svg", "name": "firewall.svg", "order": 0}]	1402	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:26.651	2026-04-28 03:29:25.27
cmlg65t7g000lwkjbkwevpa6l	gps	\N	\N	https://design5.pentasecurity.com/icons/1770701846674-gps.svg	http://127.0.0.1:19000/icons/1770701846674-gps.svg	[{"url": "http://127.0.0.1:19000/icons/1770701846674-gps.svg", "name": "gps.svg", "order": 0}]	1071	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:26.812	2026-04-28 03:29:25.273
cmlg65tcg000nwkjbkk4rvqzc	haker1	\N	\N	https://design5.pentasecurity.com/icons/1770701846838-haker1.svg	http://127.0.0.1:19000/icons/1770701846838-haker1.svg	[{"url": "http://127.0.0.1:19000/icons/1770701846838-haker1.svg", "name": "haker1.svg", "order": 0}]	999	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:26.993	2026-04-28 03:29:25.275
cmlg65tgx000pwkjbpnzvvx5s	haker2	\N	\N	https://design5.pentasecurity.com/icons/1770701847017-haker2.svg	http://127.0.0.1:19000/icons/1770701847017-haker2.svg	[{"url": "http://127.0.0.1:19000/icons/1770701847017-haker2.svg", "name": "haker2.svg", "order": 0}]	1255	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:27.153	2026-04-28 03:29:25.277
cmlg65tl2000rwkjbulw1ewu8	internet	\N	\N	https://design5.pentasecurity.com/icons/1770701847177-internet.svg	http://127.0.0.1:19000/icons/1770701847177-internet.svg	[{"url": "http://127.0.0.1:19000/icons/1770701847177-internet.svg", "name": "internet.svg", "order": 0}]	738	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:27.303	2026-04-28 03:29:25.279
cmlg65tpg000twkjb61q7y3ed	key-manage	\N	\N	https://design5.pentasecurity.com/icons/1770701847327-key-manage.svg	http://127.0.0.1:19000/icons/1770701847327-key-manage.svg	[{"url": "http://127.0.0.1:19000/icons/1770701847327-key-manage.svg", "name": "key-manage.svg", "order": 0}]	721	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:27.461	2026-04-28 03:29:25.281
cmlg65tu5000vwkjbgg2bp373	key-management	\N	\N	https://design5.pentasecurity.com/icons/1770701847485-key-management.svg	http://127.0.0.1:19000/icons/1770701847485-key-management.svg	[{"url": "http://127.0.0.1:19000/icons/1770701847485-key-management.svg", "name": "key-management.svg", "order": 0}]	990	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:27.629	2026-04-28 03:29:25.283
cmlg65ty9000xwkjbkeme9kjv	key1	\N	\N	https://design5.pentasecurity.com/icons/1770701847655-key1.svg	http://127.0.0.1:19000/icons/1770701847655-key1.svg	[{"url": "http://127.0.0.1:19000/icons/1770701847655-key1.svg", "name": "key1.svg", "order": 0}]	580	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:37:27.778	2026-04-28 03:29:25.285
cmlg66nem000zwkjbf5epivrn	main-frame	\N	\N	https://design5.pentasecurity.com/icons/1770701885773-main-frame.svg	http://127.0.0.1:19000/icons/1770701885773-main-frame.svg	[{"url": "http://127.0.0.1:19000/icons/1770701885773-main-frame.svg", "name": "main-frame.svg", "order": 0}]	867	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:05.948	2026-04-28 03:29:25.287
cmlg66nwf0017wkjbeidrfmrx	ntp-server	\N	\N	https://design5.pentasecurity.com/icons/1770701886476-ntp-server.svg	http://127.0.0.1:19000/icons/1770701886476-ntp-server.svg	[{"url": "http://127.0.0.1:19000/icons/1770701886476-ntp-server.svg", "name": "ntp-server.svg", "order": 0}]	919	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:06.591	2026-04-28 03:29:25.295
cmlg66o42001bwkjbhvu7mi02	pki-server	\N	\N	https://design5.pentasecurity.com/icons/1770701886746-pki-server.svg	http://127.0.0.1:19000/icons/1770701886746-pki-server.svg	[{"url": "http://127.0.0.1:19000/icons/1770701886746-pki-server.svg", "name": "pki-server.svg", "order": 0}]	889	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:06.866	2026-04-28 03:29:25.297
cmlg6789f001dwkjba9x9zmcj	secure-gateway	\N	\N	https://design5.pentasecurity.com/icons/1770701912841-secure-gateway.svg	http://127.0.0.1:19000/icons/1770701912841-secure-gateway.svg	[{"url": "http://127.0.0.1:19000/icons/1770701912841-secure-gateway.svg", "name": "secure-gateway.svg", "order": 0}]	1322	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:32.976	2026-04-28 03:29:25.299
cmlg678d7001fwkjbjntecrah	server-agent	\N	\N	https://design5.pentasecurity.com/icons/1770701913004-server-agent.svg	http://127.0.0.1:19000/icons/1770701913004-server-agent.svg	[{"url": "http://127.0.0.1:19000/icons/1770701913004-server-agent.svg", "name": "server-agent.svg", "order": 0}]	1600	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:33.115	2026-04-28 03:29:25.301
cmlg678he001hwkjbud3srp4x	server	\N	\N	https://design5.pentasecurity.com/icons/1770701913143-server.svg	http://127.0.0.1:19000/icons/1770701913143-server.svg	[{"url": "http://127.0.0.1:19000/icons/1770701913143-server.svg", "name": "server.svg", "order": 0}]	631	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:33.266	2026-04-28 03:29:25.303
cmlg678ld001jwkjb3zld2tf7	shield1	\N	\N	https://design5.pentasecurity.com/icons/1770701913291-shield1.svg	http://127.0.0.1:19000/icons/1770701913291-shield1.svg	[{"url": "http://127.0.0.1:19000/icons/1770701913291-shield1.svg", "name": "shield1.svg", "order": 0}]	482	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:33.409	2026-04-28 03:29:25.305
cmlg678px001lwkjbiuw9e8yr	shield2	\N	\N	https://design5.pentasecurity.com/icons/1770701913433-shield2.svg	http://127.0.0.1:19000/icons/1770701913433-shield2.svg	[{"url": "http://127.0.0.1:19000/icons/1770701913433-shield2.svg", "name": "shield2.svg", "order": 0}]	567	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:33.573	2026-04-28 03:29:25.309
cmlg678uo001nwkjbdqvb8tj1	shield3	\N	\N	https://design5.pentasecurity.com/icons/1770701913599-shield3.svg	http://127.0.0.1:19000/icons/1770701913599-shield3.svg	[{"url": "http://127.0.0.1:19000/icons/1770701913599-shield3.svg", "name": "shield3.svg", "order": 0}]	738	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:33.744	2026-04-28 03:29:25.311
cmlg678yx001pwkjbhq7xtvnf	smpt-server	\N	\N	https://design5.pentasecurity.com/icons/1770701913768-smpt-server.svg	http://127.0.0.1:19000/icons/1770701913768-smpt-server.svg	[{"url": "http://127.0.0.1:19000/icons/1770701913768-smpt-server.svg", "name": "smpt-server.svg", "order": 0}]	995	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:33.898	2026-04-28 03:29:25.312
cmlg6793a001rwkjb3v1kcks0	switch-atm	\N	\N	https://design5.pentasecurity.com/icons/1770701913921-switch-atm.svg	http://127.0.0.1:19000/icons/1770701913921-switch-atm.svg	[{"url": "http://127.0.0.1:19000/icons/1770701913921-switch-atm.svg", "name": "switch-atm.svg", "order": 0}]	1086	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:34.054	2026-04-28 03:29:25.314
cmlg67992001twkjbyuwsdnrj	switch-l2	\N	\N	https://design5.pentasecurity.com/icons/1770701914077-switch-l2.svg	http://127.0.0.1:19000/icons/1770701914077-switch-l2.svg	[{"url": "http://127.0.0.1:19000/icons/1770701914077-switch-l2.svg", "name": "switch-l2.svg", "order": 0}]	1161	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:34.263	2026-04-28 03:29:25.318
cmlg67m6n0023wkjb27sr9lmw	threat-1	\N	\N	https://design5.pentasecurity.com/icons/1770701930873-threat-1.svg	http://127.0.0.1:19000/icons/1770701930873-threat-1.svg	[{"url": "http://127.0.0.1:19000/icons/1770701930873-threat-1.svg", "name": "threat-1.svg", "order": 0}]	758	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:51.021	2026-04-28 03:29:25.327
cmlg67mal0025wkjbidx917v2	threat-2	\N	\N	https://design5.pentasecurity.com/icons/1770701931046-threat-2.svg	http://127.0.0.1:19000/icons/1770701931046-threat-2.svg	[{"url": "http://127.0.0.1:19000/icons/1770701931046-threat-2.svg", "name": "threat-2.svg", "order": 0}]	685	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:51.166	2026-04-28 03:29:25.329
cmlg67mey0027wkjbylv5fkns	trophy	\N	\N	https://design5.pentasecurity.com/icons/1770701931189-trophy.svg	http://127.0.0.1:19000/icons/1770701931189-trophy.svg	[{"url": "http://127.0.0.1:19000/icons/1770701931189-trophy.svg", "name": "trophy.svg", "order": 0}]	957	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:51.322	2026-04-28 03:29:25.331
cmlg67mig0029wkjbsxqzpmd4	virus-wall	\N	\N	https://design5.pentasecurity.com/icons/1770701931346-virus-wall.svg	http://127.0.0.1:19000/icons/1770701931346-virus-wall.svg	[{"url": "http://127.0.0.1:19000/icons/1770701931346-virus-wall.svg", "name": "virus-wall.svg", "order": 0}]	1985	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:51.449	2026-04-28 03:29:25.333
cmlg67mmb002bwkjbyjyzvmvt	vl-dsk-server	\N	\N	https://design5.pentasecurity.com/icons/1770701931472-vl-dsk-server.svg	http://127.0.0.1:19000/icons/1770701931472-vl-dsk-server.svg	[{"url": "http://127.0.0.1:19000/icons/1770701931472-vl-dsk-server.svg", "name": "vl-dsk-server.svg", "order": 0}]	1031	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:51.588	2026-04-28 03:29:25.335
cmlg67mq2002dwkjbifcmzzro	wafer	\N	\N	https://design5.pentasecurity.com/icons/1770701931610-wafer.svg	http://127.0.0.1:19000/icons/1770701931610-wafer.svg	[{"url": "http://127.0.0.1:19000/icons/1770701931610-wafer.svg", "name": "wafer.svg", "order": 0}]	653	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:51.722	2026-04-28 03:29:25.337
cmlg67mxn002fwkjb1i1q9zwy	web-server	\N	\N	https://design5.pentasecurity.com/icons/1770701931745-web-server.svg	http://127.0.0.1:19000/icons/1770701931745-web-server.svg	[{"url": "http://127.0.0.1:19000/icons/1770701931745-web-server.svg", "name": "web-server.svg", "order": 0}]	1082	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:51.995	2026-04-28 03:29:25.339
cmlg6d5lu002hwkjbz285a4o6	developer	\N	\N	https://design5.pentasecurity.com/icons/1770702189315-developer.svg	http://127.0.0.1:19000/icons/1770702189315-developer.svg	[{"url": "http://127.0.0.1:19000/icons/1770702189315-developer.svg", "name": "developer.svg", "order": 0}]	875	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:43:09.475	2026-04-28 03:29:25.34
cmlg6grk2002jwkjb022jyq6t	partner	\N	\N	https://design5.pentasecurity.com/icons/1770702357435-partner.svg	http://127.0.0.1:19000/icons/1770702357435-partner.svg	[{"url": "http://127.0.0.1:19000/icons/1770702357435-partner.svg", "name": "partner.svg", "order": 0}]	1232	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:45:57.888	2026-04-28 03:29:25.342
cmlh9okth0001nw1wwf2v971o	base-station1	\N	\N	https://design5.pentasecurity.com/icons/1770768226779-base-station1.svg	http://127.0.0.1:19000/icons/1770768226779-base-station1.svg	[{"url": "http://127.0.0.1:19000/icons/1770768226779-base-station1.svg", "name": "base-station1.svg", "order": 0}]	1045	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:03:47.429	2026-04-28 03:29:25.345
cmlh9okzk0003nw1wm3283zzn	base-station2	\N	\N	https://design5.pentasecurity.com/icons/1770768227489-base-station2.svg	http://127.0.0.1:19000/icons/1770768227489-base-station2.svg	[{"url": "http://127.0.0.1:19000/icons/1770768227489-base-station2.svg", "name": "base-station2.svg", "order": 0}]	1171	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:03:47.649	2026-04-28 03:29:25.347
cmlh9p5hd0005z377nbkpyt6o	car-suv	\N	\N	https://design5.pentasecurity.com/icons/1770768254103-car-suv.svg	http://127.0.0.1:19000/icons/1770768254103-car-suv.svg	[{"url": "http://127.0.0.1:19000/icons/1770768254103-car-suv.svg", "name": "car-suv.svg", "order": 0}]	1160	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:04:14.209	2026-04-28 03:29:25.358
cmlh9p5mq0007z377qw4jtug1	card-reader	\N	\N	https://design5.pentasecurity.com/icons/1770768254233-card-reader.svg	http://127.0.0.1:19000/icons/1770768254233-card-reader.svg	[{"url": "http://127.0.0.1:19000/icons/1770768254233-card-reader.svg", "name": "card-reader.svg", "order": 0}]	1260	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:04:14.403	2026-04-28 03:29:25.36
cmlh9p5sj0009z377rvda98ft	cargo-ship	\N	\N	https://design5.pentasecurity.com/icons/1770768254428-cargo-ship.svg	http://127.0.0.1:19000/icons/1770768254428-cargo-ship.svg	[{"url": "http://127.0.0.1:19000/icons/1770768254428-cargo-ship.svg", "name": "cargo-ship.svg", "order": 0}]	1186	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:04:14.611	2026-04-28 03:29:25.362
cmlh9p5wp000bz377ix493lp2	data-leakage	\N	\N	https://design5.pentasecurity.com/icons/1770768254635-data-leakage.svg	http://127.0.0.1:19000/icons/1770768254635-data-leakage.svg	[{"url": "http://127.0.0.1:19000/icons/1770768254635-data-leakage.svg", "name": "data-leakage.svg", "order": 0}]	1855	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:04:14.761	2026-04-28 03:29:25.364
cmlh9p613000dz377tku4t8ih	electrocardiogram	\N	\N	https://design5.pentasecurity.com/icons/1770768254787-electrocardiogram.svg	http://127.0.0.1:19000/icons/1770768254787-electrocardiogram.svg	[{"url": "http://127.0.0.1:19000/icons/1770768254787-electrocardiogram.svg", "name": "electrocardiogram.svg", "order": 0}]	770	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:04:14.919	2026-04-28 03:29:25.367
cmlh9p65n000fz377qgwcxd1f	excavator	\N	\N	https://design5.pentasecurity.com/icons/1770768254945-excavator.svg	http://127.0.0.1:19000/icons/1770768254945-excavator.svg	[{"url": "http://127.0.0.1:19000/icons/1770768254945-excavator.svg", "name": "excavator.svg", "order": 0}]	817	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:04:15.084	2026-04-28 03:29:25.369
cmlh9qv7b0001e6b0u3nxcdf6	fork-lift	\N	\N	https://design5.pentasecurity.com/icons/1770768334054-fork-lift.svg	http://127.0.0.1:19000/icons/1770768334054-fork-lift.svg	[{"url": "http://127.0.0.1:19000/icons/1770768334054-fork-lift.svg", "name": "fork-lift.svg", "order": 0}]	874	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:05:34.196	2026-04-28 03:29:25.371
cmlh9qvbt0003e6b0h9azjmwe	helicopter1	\N	\N	https://design5.pentasecurity.com/icons/1770768334228-helicopter1.svg	http://127.0.0.1:19000/icons/1770768334228-helicopter1.svg	[{"url": "http://127.0.0.1:19000/icons/1770768334228-helicopter1.svg", "name": "helicopter1.svg", "order": 0}]	1145	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:05:34.361	2026-04-28 03:29:25.373
cmlh9qvg30005e6b04r4y3ye8	helicopter2	\N	\N	https://design5.pentasecurity.com/icons/1770768334390-helicopter2.svg	http://127.0.0.1:19000/icons/1770768334390-helicopter2.svg	[{"url": "http://127.0.0.1:19000/icons/1770768334390-helicopter2.svg", "name": "helicopter2.svg", "order": 0}]	1091	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:05:34.516	2026-04-28 03:29:25.375
cmlh9qvkm0007e6b0fh7q0sac	home-gateway	\N	\N	https://design5.pentasecurity.com/icons/1770768334546-home-gateway.svg	http://127.0.0.1:19000/icons/1770768334546-home-gateway.svg	[{"url": "http://127.0.0.1:19000/icons/1770768334546-home-gateway.svg", "name": "home-gateway.svg", "order": 0}]	1745	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:05:34.679	2026-04-28 03:29:25.379
cmlh9rtvc000je6b0p8kk4p2y	plane2	\N	\N	https://design5.pentasecurity.com/icons/1770768378990-plane2.svg	http://127.0.0.1:19000/icons/1770768378990-plane2.svg	[{"url": "http://127.0.0.1:19000/icons/1770768378990-plane2.svg", "name": "plane2.svg", "order": 0}]	860	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:19.128	2026-04-28 03:29:25.391
cmlh9rtza000le6b0mwim86tq	street-lamp	\N	\N	https://design5.pentasecurity.com/icons/1770768379157-street-lamp.svg	http://127.0.0.1:19000/icons/1770768379157-street-lamp.svg	[{"url": "http://127.0.0.1:19000/icons/1770768379157-street-lamp.svg", "name": "street-lamp.svg", "order": 0}]	666	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:19.27	2026-04-28 03:29:25.395
cmlh9ru3a000ne6b0brczdwph	subway	\N	\N	https://design5.pentasecurity.com/icons/1770768379300-subway.svg	http://127.0.0.1:19000/icons/1770768379300-subway.svg	[{"url": "http://127.0.0.1:19000/icons/1770768379300-subway.svg", "name": "subway.svg", "order": 0}]	1131	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:19.414	2026-04-28 03:29:25.396
cmlh9ru6m000pe6b07owfmb5u	tool1	\N	\N	https://design5.pentasecurity.com/icons/1770768379442-tool1.svg	http://127.0.0.1:19000/icons/1770768379442-tool1.svg	[{"url": "http://127.0.0.1:19000/icons/1770768379442-tool1.svg", "name": "tool1.svg", "order": 0}]	889	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:19.534	2026-04-28 03:29:25.399
cmlh9ruaz000re6b0427g2jux	tool2	\N	\N	https://design5.pentasecurity.com/icons/1770768379562-tool2.svg	http://127.0.0.1:19000/icons/1770768379562-tool2.svg	[{"url": "http://127.0.0.1:19000/icons/1770768379562-tool2.svg", "name": "tool2.svg", "order": 0}]	789	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:19.692	2026-04-28 03:29:25.401
cmlh9rufd000te6b0rgachl11	tool3	\N	\N	https://design5.pentasecurity.com/icons/1770768379723-tool3.svg	http://127.0.0.1:19000/icons/1770768379723-tool3.svg	[{"url": "http://127.0.0.1:19000/icons/1770768379723-tool3.svg", "name": "tool3.svg", "order": 0}]	1268	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:19.849	2026-04-28 03:29:25.403
cmlh9ruit000ve6b0iqqgbblk	tractor	\N	\N	https://design5.pentasecurity.com/icons/1770768379877-tractor.svg	http://127.0.0.1:19000/icons/1770768379877-tractor.svg	[{"url": "http://127.0.0.1:19000/icons/1770768379877-tractor.svg", "name": "tractor.svg", "order": 0}]	841	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:19.974	2026-04-28 03:29:25.405
cmlh9rumy000xe6b06fq0zwa0	truck	\N	\N	https://design5.pentasecurity.com/icons/1770768380002-truck.svg	http://127.0.0.1:19000/icons/1770768380002-truck.svg	[{"url": "http://127.0.0.1:19000/icons/1770768380002-truck.svg", "name": "truck.svg", "order": 0}]	852	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:20.122	2026-04-28 03:29:25.409
cmlh9ruqd000ze6b0qqy3ezme	usb	\N	\N	https://design5.pentasecurity.com/icons/1770768380150-usb.svg	http://127.0.0.1:19000/icons/1770768380150-usb.svg	[{"url": "http://127.0.0.1:19000/icons/1770768380150-usb.svg", "name": "usb.svg", "order": 0}]	1039	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:06:20.245	2026-04-28 03:29:25.411
cmlhbtdkc0001pw0665bsz2f0	abs	\N	\N	https://design5.pentasecurity.com/icons/1770771809946-abs.svg	http://127.0.0.1:19000/icons/1770771809946-abs.svg	[{"url": "http://127.0.0.1:19000/icons/1770771809946-abs.svg", "name": "abs.svg", "order": 0}]	1587	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:30.54	2026-04-28 03:29:25.414
cmlhbtdur0005pw06uwkpiiv2	ambulance	\N	\N	https://design5.pentasecurity.com/icons/1770771810778-ambulance.svg	http://127.0.0.1:19000/icons/1770771810778-ambulance.svg	[{"url": "http://127.0.0.1:19000/icons/1770771810778-ambulance.svg", "name": "ambulance.svg", "order": 0}]	972	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:30.916	2026-04-28 03:29:25.416
cmlhbtvfa000lpw063jb1uz2b	car-front2	\N	\N	https://design5.pentasecurity.com/icons/1770771833543-car-front2.svg	http://127.0.0.1:19000/icons/1770771833543-car-front2.svg	[{"url": "http://127.0.0.1:19000/icons/1770771833543-car-front2.svg", "name": "car-front2.svg", "order": 0}]	1559	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:53.686	2026-04-28 03:29:25.433
cmlhbtvjw000npw0612r325pn	car-seat	\N	\N	https://design5.pentasecurity.com/icons/1770771833725-car-seat.svg	http://127.0.0.1:19000/icons/1770771833725-car-seat.svg	[{"url": "http://127.0.0.1:19000/icons/1770771833725-car-seat.svg", "name": "car-seat.svg", "order": 0}]	592	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:53.853	2026-04-28 03:29:25.435
cmlhbtvok000ppw06uuoila2q	car1	\N	\N	https://design5.pentasecurity.com/icons/1770771833890-car1.svg	http://127.0.0.1:19000/icons/1770771833890-car1.svg	[{"url": "http://127.0.0.1:19000/icons/1770771833890-car1.svg", "name": "car1.svg", "order": 0}]	1078	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:54.02	2026-04-28 03:29:25.437
cmlhbtvss000rpw06rdg5wi83	car2	\N	\N	https://design5.pentasecurity.com/icons/1770771834056-car2.svg	http://127.0.0.1:19000/icons/1770771834056-car2.svg	[{"url": "http://127.0.0.1:19000/icons/1770771834056-car2.svg", "name": "car2.svg", "order": 0}]	1441	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:03:54.172	2026-04-28 03:29:25.439
cmlhbue6a000tpw06m0rvtecp	charging-station	\N	\N	https://design5.pentasecurity.com/icons/1770771857636-charging-station.svg	http://127.0.0.1:19000/icons/1770771857636-charging-station.svg	[{"url": "http://127.0.0.1:19000/icons/1770771857636-charging-station.svg", "name": "charging-station.svg", "order": 0}]	1070	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:17.982	2026-04-28 03:29:25.443
cmlhbueho000xpw067jlawyzi	electric-charge	\N	\N	https://design5.pentasecurity.com/icons/1770771858262-electric-charge.svg	http://127.0.0.1:19000/icons/1770771858262-electric-charge.svg	[{"url": "http://127.0.0.1:19000/icons/1770771858262-electric-charge.svg", "name": "electric-charge.svg", "order": 0}]	886	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:18.397	2026-04-28 03:29:25.446
cmlhbuem1000zpw069h1jpwzt	engine	\N	\N	https://design5.pentasecurity.com/icons/1770771858434-engine.svg	http://127.0.0.1:19000/icons/1770771858434-engine.svg	[{"url": "http://127.0.0.1:19000/icons/1770771858434-engine.svg", "name": "engine.svg", "order": 0}]	899	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:18.554	2026-04-28 03:29:25.448
cmlhbut6k0019pw06j1jkjs88	motorcycle-front	\N	\N	https://design5.pentasecurity.com/icons/1770771877270-motorcycle-front.svg	http://127.0.0.1:19000/icons/1770771877270-motorcycle-front.svg	[{"url": "http://127.0.0.1:19000/icons/1770771877270-motorcycle-front.svg", "name": "motorcycle-front.svg", "order": 0}]	1120	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:37.433	2026-04-28 03:29:25.458
cmlhbutaz001bpw064okit4fl	motorcycle	\N	\N	https://design5.pentasecurity.com/icons/1770771877489-motorcycle.svg	http://127.0.0.1:19000/icons/1770771877489-motorcycle.svg	[{"url": "http://127.0.0.1:19000/icons/1770771877489-motorcycle.svg", "name": "motorcycle.svg", "order": 0}]	1137	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:37.595	2026-04-28 03:29:25.46
cmlhbutf9001dpw068v0mdwkk	no-ban	\N	\N	https://design5.pentasecurity.com/icons/1770771877631-no-ban.svg	http://127.0.0.1:19000/icons/1770771877631-no-ban.svg	[{"url": "http://127.0.0.1:19000/icons/1770771877631-no-ban.svg", "name": "no-ban.svg", "order": 0}]	535	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:37.75	2026-04-28 03:29:25.463
cmlhbutk0001fpw06z91wc65o	oil	\N	\N	https://design5.pentasecurity.com/icons/1770771877789-oil.svg	http://127.0.0.1:19000/icons/1770771877789-oil.svg	[{"url": "http://127.0.0.1:19000/icons/1770771877789-oil.svg", "name": "oil.svg", "order": 0}]	990	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:37.92	2026-04-28 03:29:25.465
cmlhbutqd001hpw06nohbh5es	parking	\N	\N	https://design5.pentasecurity.com/icons/1770771877955-parking.svg	http://127.0.0.1:19000/icons/1770771877955-parking.svg	[{"url": "http://127.0.0.1:19000/icons/1770771877955-parking.svg", "name": "parking.svg", "order": 0}]	753	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:38.15	2026-04-28 03:29:25.467
cmlhbutum001jpw06w0cwvx3j	radio	\N	\N	https://design5.pentasecurity.com/icons/1770771878185-radio.svg	http://127.0.0.1:19000/icons/1770771878185-radio.svg	[{"url": "http://127.0.0.1:19000/icons/1770771878185-radio.svg", "name": "radio.svg", "order": 0}]	709	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:38.303	2026-04-28 03:29:25.47
cmlhbuu06001lpw06fhs315um	road	\N	\N	https://design5.pentasecurity.com/icons/1770771878340-road.svg	http://127.0.0.1:19000/icons/1770771878340-road.svg	[{"url": "http://127.0.0.1:19000/icons/1770771878340-road.svg", "name": "road.svg", "order": 0}]	732	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:04:38.502	2026-04-28 03:29:25.472
cmlhbvlre001ppw06tqbx67w2	seat-belt	\N	\N	https://design5.pentasecurity.com/icons/1770771914329-seat-belt.svg	http://127.0.0.1:19000/icons/1770771914329-seat-belt.svg	[{"url": "http://127.0.0.1:19000/icons/1770771914329-seat-belt.svg", "name": "seat-belt.svg", "order": 0}]	828	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:05:14.475	2026-04-28 03:29:25.475
cmlhbvlw8001rpw067mpgma79	smart-key	\N	\N	https://design5.pentasecurity.com/icons/1770771914512-smart-key.svg	http://127.0.0.1:19000/icons/1770771914512-smart-key.svg	[{"url": "http://127.0.0.1:19000/icons/1770771914512-smart-key.svg", "name": "smart-key.svg", "order": 0}]	965	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:05:14.648	2026-04-28 03:29:25.477
cmlhbvm0e001tpw065r1y0uod	stop	\N	\N	https://design5.pentasecurity.com/icons/1770771914689-stop.svg	http://127.0.0.1:19000/icons/1770771914689-stop.svg	[{"url": "http://127.0.0.1:19000/icons/1770771914689-stop.svg", "name": "stop.svg", "order": 0}]	1462	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:05:14.799	2026-04-28 03:29:25.479
cmlhbvmma0023pw0637tia72n	traffic-light3	\N	\N	https://design5.pentasecurity.com/icons/1770771915481-traffic-light3.svg	http://127.0.0.1:19000/icons/1770771915481-traffic-light3.svg	[{"url": "http://127.0.0.1:19000/icons/1770771915481-traffic-light3.svg", "name": "traffic-light3.svg", "order": 0}]	1062	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:05:15.587	2026-04-28 03:29:25.49
cmlhbx2t30025pw06xlzzvj7z	train1	\N	\N	https://design5.pentasecurity.com/icons/1770771982873-train1.svg	http://127.0.0.1:19000/icons/1770771982873-train1.svg	[{"url": "http://127.0.0.1:19000/icons/1770771982873-train1.svg", "name": "train1.svg", "order": 0}]	776	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:06:23.215	2026-04-28 03:29:25.492
cmlhbx2ye0027pw062zgydkhv	train2	\N	\N	https://design5.pentasecurity.com/icons/1770771983282-train2.svg	http://127.0.0.1:19000/icons/1770771983282-train2.svg	[{"url": "http://127.0.0.1:19000/icons/1770771983282-train2.svg", "name": "train2.svg", "order": 0}]	714	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:06:23.414	2026-04-28 03:29:25.494
cmlhbx3360029pw06588lrai1	truck-boxtop1	\N	\N	https://design5.pentasecurity.com/icons/1770771983451-truck-boxtop1.svg	http://127.0.0.1:19000/icons/1770771983451-truck-boxtop1.svg	[{"url": "http://127.0.0.1:19000/icons/1770771983451-truck-boxtop1.svg", "name": "truck-boxtop1.svg", "order": 0}]	737	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:06:23.587	2026-04-28 03:29:25.496
cmlhbx38g002bpw06qjpyhydl	truck-boxtop2	\N	\N	https://design5.pentasecurity.com/icons/1770771983622-truck-boxtop2.svg	http://127.0.0.1:19000/icons/1770771983622-truck-boxtop2.svg	[{"url": "http://127.0.0.1:19000/icons/1770771983622-truck-boxtop2.svg", "name": "truck-boxtop2.svg", "order": 0}]	2008	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:06:23.776	2026-04-28 03:29:25.499
cmlhbx3d4002dpw0696cnjyts	vdc	\N	\N	https://design5.pentasecurity.com/icons/1770771983812-vdc.svg	http://127.0.0.1:19000/icons/1770771983812-vdc.svg	[{"url": "http://127.0.0.1:19000/icons/1770771983812-vdc.svg", "name": "vdc.svg", "order": 0}]	1636	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:06:23.945	2026-04-28 03:29:25.501
cmlhbx3h3002fpw063aa5ejtg	warning-light	\N	\N	https://design5.pentasecurity.com/icons/1770771983982-warning-light.svg	http://127.0.0.1:19000/icons/1770771983982-warning-light.svg	[{"url": "http://127.0.0.1:19000/icons/1770771983982-warning-light.svg", "name": "warning-light.svg", "order": 0}]	783	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:06:24.088	2026-04-28 03:29:25.503
cmlhbx3m4002hpw06wtr81dha	weather	\N	\N	https://design5.pentasecurity.com/icons/1770771984126-weather.svg	http://127.0.0.1:19000/icons/1770771984126-weather.svg	[{"url": "http://127.0.0.1:19000/icons/1770771984126-weather.svg", "name": "weather.svg", "order": 0}]	1084	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:06:24.268	2026-04-28 03:29:25.506
cmlhbx3r9002jpw06d5g0i2zc	wiper	\N	\N	https://design5.pentasecurity.com/icons/1770771984306-wiper.svg	http://127.0.0.1:19000/icons/1770771984306-wiper.svg	[{"url": "http://127.0.0.1:19000/icons/1770771984306-wiper.svg", "name": "wiper.svg", "order": 0}]	787	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 01:06:24.454	2026-04-28 03:29:25.509
cmkeyyjvz0001kiuwnqhn47ot	WAPPLES SA	\N	주소영역에 Gartner 라이선스 문구 추가	https://design5.pentasecurity.com/posts/wapples/WAPPLES_SA_Brochure________KR_251216_1768452499560_q64xkk6gtdi.pdf	http://127.0.0.1:19000/posts/wapples/WAPPLES_SA_Brochure________KR_251216_1768452499560_q64xkk6gtdi.pdf	[{"url": "http://127.0.0.1:19000/posts/wapples/WAPPLES_SA_Brochure________KR_251216_1768452499560_q64xkk6gtdi.pdf", "name": "WAPPLES_SA_Brochure_통합_KR_251216.pdf", "order": 0}]	0	image	image/*	cmkdc6dfw000bflsw1kajwbt2	PUBLISHED	f	0	0	WAPPLES SA	KR	2025-12-15 15:00:00	cmkdc777200001251hxs59lzx	cmkdc777200001251hxs59lzx	2026-01-15 04:48:22.204	2026-04-28 03:29:25.512
cmlst5vrx000vz5e438bo4izw	check-list	\N	\N	https://design5.pentasecurity.com/icons/1771466075305-check-list.svg	http://127.0.0.1:19000/icons/1771466075305-check-list.svg	[{"url": "http://127.0.0.1:19000/icons/1771466075305-check-list.svg", "name": "check-list.svg", "order": 0}]	729	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:54:35.421	2026-04-28 03:29:25.524
cmlst5vwg000xz5e4w80y6f2o	consulting	\N	\N	https://design5.pentasecurity.com/icons/1771466075446-consulting.svg	http://127.0.0.1:19000/icons/1771466075446-consulting.svg	[{"url": "http://127.0.0.1:19000/icons/1771466075446-consulting.svg", "name": "consulting.svg", "order": 0}]	901	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:54:35.585	2026-04-28 03:29:25.528
cmlst7cl6000zz5e4nnqb6afx	db-table	\N	\N	https://design5.pentasecurity.com/icons/1771466143362-db-table.svg	http://127.0.0.1:19000/icons/1771466143362-db-table.svg	[{"url": "http://127.0.0.1:19000/icons/1771466143362-db-table.svg", "name": "db-table.svg", "order": 0}]	1504	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:55:43.864	2026-04-28 03:29:25.532
cmlst7cot0011z5e4me9ozsix	dcu	\N	\N	https://design5.pentasecurity.com/icons/1771466143889-dcu.svg	http://127.0.0.1:19000/icons/1771466143889-dcu.svg	[{"url": "http://127.0.0.1:19000/icons/1771466143889-dcu.svg", "name": "dcu.svg", "order": 0}]	1116	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:55:43.997	2026-04-28 03:29:25.535
cmlst7cso0013z5e455t1syki	documentation2	\N	\N	https://design5.pentasecurity.com/icons/1771466144020-documentation2.svg	http://127.0.0.1:19000/icons/1771466144020-documentation2.svg	[{"url": "http://127.0.0.1:19000/icons/1771466144020-documentation2.svg", "name": "documentation2.svg", "order": 0}]	901	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:55:44.137	2026-04-28 03:29:25.537
cmlst7cvz0015z5e4o46a4nz8	electric	\N	\N	https://design5.pentasecurity.com/icons/1771466144161-electric.svg	http://127.0.0.1:19000/icons/1771466144161-electric.svg	[{"url": "http://127.0.0.1:19000/icons/1771466144161-electric.svg", "name": "electric.svg", "order": 0}]	453	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:55:44.255	2026-04-28 03:29:25.539
cmlst7d4l0017z5e4obd5wdep	encryption-table	\N	\N	https://design5.pentasecurity.com/icons/1771466144279-encryption-table.svg	http://127.0.0.1:19000/icons/1771466144279-encryption-table.svg	[{"url": "http://127.0.0.1:19000/icons/1771466144279-encryption-table.svg", "name": "encryption-table.svg", "order": 0}]	1162	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:55:44.565	2026-04-28 03:29:25.544
cmlst7d9a0019z5e4pthwpx3k	file	\N	\N	https://design5.pentasecurity.com/icons/1771466144588-file.svg	http://127.0.0.1:19000/icons/1771466144588-file.svg	[{"url": "http://127.0.0.1:19000/icons/1771466144588-file.svg", "name": "file.svg", "order": 0}]	672	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:55:44.734	2026-04-28 03:29:25.549
cmlst50qj0001z5e44ihszx3t	access-point	\N	\N	https://design5.pentasecurity.com/icons/1771466034415-access-point.svg	http://127.0.0.1:19000/icons/1771466034415-access-point.svg	[{"url": "http://127.0.0.1:19000/icons/1771466034415-access-point.svg", "name": "access-point.svg", "order": 0}]	1004	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:53:55.194	2026-04-28 03:29:25.552
cmlst51hy000dz5e41v1of9v9	building1	\N	\N	https://design5.pentasecurity.com/icons/1771466036044-building1.svg	http://127.0.0.1:19000/icons/1771466036044-building1.svg	[{"url": "http://127.0.0.1:19000/icons/1771466036044-building1.svg", "name": "building1.svg", "order": 0}]	1179	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:53:56.182	2026-04-28 03:29:25.568
cmlst51mn000fz5e4s2bbelqb	building2	\N	\N	https://design5.pentasecurity.com/icons/1771466036204-building2.svg	http://127.0.0.1:19000/icons/1771466036204-building2.svg	[{"url": "http://127.0.0.1:19000/icons/1771466036204-building2.svg", "name": "building2.svg", "order": 0}]	1359	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:53:56.351	2026-04-28 03:29:25.57
cmlst51qh000hz5e46yr06uuk	carrier	\N	\N	https://design5.pentasecurity.com/icons/1771466036373-carrier.svg	http://127.0.0.1:19000/icons/1771466036373-carrier.svg	[{"url": "http://127.0.0.1:19000/icons/1771466036373-carrier.svg", "name": "carrier.svg", "order": 0}]	807	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:53:56.49	2026-04-28 03:29:25.572
cmlst5v1f000jz5e40dsaa0cn	cd	\N	\N	https://design5.pentasecurity.com/icons/1771466074317-cd.svg	http://127.0.0.1:19000/icons/1771466074317-cd.svg	[{"url": "http://127.0.0.1:19000/icons/1771466074317-cd.svg", "name": "cd.svg", "order": 0}]	464	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:54:34.465	2026-04-28 03:29:25.573
cmlst5v61000lz5e4pwddbfck	certificate	\N	\N	https://design5.pentasecurity.com/icons/1771466074493-certificate.svg	http://127.0.0.1:19000/icons/1771466074493-certificate.svg	[{"url": "http://127.0.0.1:19000/icons/1771466074493-certificate.svg", "name": "certificate.svg", "order": 0}]	867	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:54:34.634	2026-04-28 03:29:25.577
cmlst5v9v000nz5e4xkqocpzn	certification-center	\N	\N	https://design5.pentasecurity.com/icons/1771466074662-certification-center.svg	http://127.0.0.1:19000/icons/1771466074662-certification-center.svg	[{"url": "http://127.0.0.1:19000/icons/1771466074662-certification-center.svg", "name": "certification-center.svg", "order": 0}]	761	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:54:34.771	2026-04-28 03:29:25.579
cmlst951m001fz5e465chfq56	hard-disk	\N	\N	https://design5.pentasecurity.com/icons/1771466227294-hard-disk.svg	http://127.0.0.1:19000/icons/1771466227294-hard-disk.svg	[{"url": "http://127.0.0.1:19000/icons/1771466227294-hard-disk.svg", "name": "hard-disk.svg", "order": 0}]	697	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:07.402	2026-04-28 03:29:25.584
cmlst9565001hz5e4vf0pyfo5	hub	\N	\N	https://design5.pentasecurity.com/icons/1771466227427-hub.svg	http://127.0.0.1:19000/icons/1771466227427-hub.svg	[{"url": "http://127.0.0.1:19000/icons/1771466227427-hub.svg", "name": "hub.svg", "order": 0}]	1035	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:07.565	2026-04-28 03:29:25.586
cmlst959u001jz5e4pznhvchb	ics-report	\N	\N	https://design5.pentasecurity.com/icons/1771466227588-ics-report.svg	http://127.0.0.1:19000/icons/1771466227588-ics-report.svg	[{"url": "http://127.0.0.1:19000/icons/1771466227588-ics-report.svg", "name": "ics-report.svg", "order": 0}]	947	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:07.699	2026-04-28 03:29:25.588
cmlst95t6001tz5e4zx2bmgm9	log	\N	\N	https://design5.pentasecurity.com/icons/1771466228295-log.svg	http://127.0.0.1:19000/icons/1771466228295-log.svg	[{"url": "http://127.0.0.1:19000/icons/1771466228295-log.svg", "name": "log.svg", "order": 0}]	1308	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:08.395	2026-04-28 03:29:25.599
cmlst9uqy000113mu7k0wal3e	microchip	\N	\N	https://design5.pentasecurity.com/icons/1771466260531-microchip.svg	http://127.0.0.1:19000/icons/1771466260531-microchip.svg	[{"url": "http://127.0.0.1:19000/icons/1771466260531-microchip.svg", "name": "microchip.svg", "order": 0}]	1639	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:40.715	2026-04-28 03:29:25.601
cmlst9uv2000313mubkkd1off	modem1	\N	\N	https://design5.pentasecurity.com/icons/1771466260742-modem1.svg	http://127.0.0.1:19000/icons/1771466260742-modem1.svg	[{"url": "http://127.0.0.1:19000/icons/1771466260742-modem1.svg", "name": "modem1.svg", "order": 0}]	1065	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:40.862	2026-04-28 03:29:25.603
cmlst9uz3000513mufpovt5yl	modem2	\N	\N	https://design5.pentasecurity.com/icons/1771466260890-modem2.svg	http://127.0.0.1:19000/icons/1771466260890-modem2.svg	[{"url": "http://127.0.0.1:19000/icons/1771466260890-modem2.svg", "name": "modem2.svg", "order": 0}]	1254	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:41.007	2026-04-28 03:29:25.605
cmlst9v2s000713mu3xqyghuc	nfc	\N	\N	https://design5.pentasecurity.com/icons/1771466261035-nfc.svg	http://127.0.0.1:19000/icons/1771466261035-nfc.svg	[{"url": "http://127.0.0.1:19000/icons/1771466261035-nfc.svg", "name": "nfc.svg", "order": 0}]	583	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:41.141	2026-04-28 03:29:25.607
cmlst9v81000913mue4qmmbjx	printer	\N	\N	https://design5.pentasecurity.com/icons/1771466261168-printer.svg	http://127.0.0.1:19000/icons/1771466261168-printer.svg	[{"url": "http://127.0.0.1:19000/icons/1771466261168-printer.svg", "name": "printer.svg", "order": 0}]	823	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:41.329	2026-04-28 03:29:25.609
cmlst9vgi000d13mu5mf9mygf	remote-access	\N	\N	https://design5.pentasecurity.com/icons/1771466261505-remote-access.svg	http://127.0.0.1:19000/icons/1771466261505-remote-access.svg	[{"url": "http://127.0.0.1:19000/icons/1771466261505-remote-access.svg", "name": "remote-access.svg", "order": 0}]	1156	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:57:41.634	2026-04-28 03:29:25.612
cmkdfqy09001j13vek2s3njeu	D.AMO DE	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_DE_b_1768359765695_fhm0hngm4pe.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_DE_b_1768359765695_fhm0hngm4pe.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_DE_b_1768359765695_fhm0hngm4pe.svg", "name": "D.AMO DE_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMvLrhZ+JoAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAWSURBVHicY2BABowQgCKGXRAqilUQAAQTABuYxODTAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_DE_b_1768359765695_fhm0hngm4pe.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:02:48.489	2026-04-28 03:29:25.614
cmkdfw4ws002k13vecnswrflf	iSIGN Certification	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_Certification_b_1768360008174_e8iso4zxlxl.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_Certification_b_1768360008174_e8iso4zxlxl.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_Certification_b_1768360008174_e8iso4zxlxl.svg", "name": "iSIGN Certification_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMsJHOhQkcAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAXSURBVHicY2BkZGRkQAAQlxFEIolBRAEBgwARYfBbGgAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_Certification_b_1768360008174_e8iso4zxlxl.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:06:50.717	2026-04-28 03:29:25.617
cmlstaclu000n13muo4a8pg4j	table	\N	\N	https://design5.pentasecurity.com/icons/1771466283736-table.svg	http://127.0.0.1:19000/icons/1771466283736-table.svg	[{"url": "http://127.0.0.1:19000/icons/1771466283736-table.svg", "name": "table.svg", "order": 0}]	763	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:58:03.858	2026-04-28 03:29:25.633
cmlstacvc000r13muxsiex29h	valve	\N	\N	https://design5.pentasecurity.com/icons/1771466284061-valve.svg	http://127.0.0.1:19000/icons/1771466284061-valve.svg	[{"url": "http://127.0.0.1:19000/icons/1771466284061-valve.svg", "name": "valve.svg", "order": 0}]	911	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:58:04.2	2026-04-28 03:29:25.636
cmlstad04000t13murs3rnmzq	vpn	\N	\N	https://design5.pentasecurity.com/icons/1771466284230-vpn.svg	http://127.0.0.1:19000/icons/1771466284230-vpn.svg	[{"url": "http://127.0.0.1:19000/icons/1771466284230-vpn.svg", "name": "vpn.svg", "order": 0}]	1081	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-19 01:58:04.372	2026-04-28 03:29:25.638
cmkdg8515004p13veqqqfduw9	Cloudbric	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Cloudbric_b_1768360567903_wsdo161mug.png	http://127.0.0.1:19000/posts/ci-bi/Cloudbric_b_1768360567903_wsdo161mug.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Cloudbric_b_1768360567903_wsdo161mug.svg", "name": "Cloudbric_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMeIwC1g5UAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAcSURBVHicY2BgYGBgRAAQFwKQBOGiyGLYBUGiAAgrADNrat1UAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Cloudbric_b_1768360567903_wsdo161mug.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:16:10.745	2026-04-28 03:29:25.643
cmkdohwcp0003sp7r87q4e0mv	대표이사 2	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/________2_1768374459321_cepi4jducdr.png	http://127.0.0.1:19000/posts/character/________2_1768374459321_cepi4jducdr.svg	[{"url": "http://127.0.0.1:19000/posts/character/________2_1768374459321_cepi4jducdr.svg", "name": "대표이사2.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAUCAMAAABlGZcgAAAACVBMVEXY2drZ29zZ29zyOrLHAAAAA3RSTlNWRjQV0IrqAAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAQUlEQVR4nJXLSQ4AIAwCQPD/jzaF1u2iYkw6WNH24NFsnCaDKuxoInLOXtrMsAdkkYZO9VA0+7oYrpz2n5WX93939P0BFBdyoa4AAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/________2_1768374459321_cepi4jducdr.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	대표이사	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 07:07:42.978	2026-04-28 03:29:25.646
cmkelyf44000bqsljjnen4gds	보안사업본부 3	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______________3_1768430657908_uf7pp3pb1g8.png	http://127.0.0.1:19000/posts/character/_______________3_1768430657908_uf7pp3pb1g8.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______________3_1768430657908_uf7pp3pb1g8.svg", "name": "보안사업본부3.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAANCAMAAACejr5sAAAACVBMVEWprbGFiYyipqmkgbwYAAAAA3RSTlM4Oy4wapIBAAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAQUlEQVR4nI2MQQ4AMAjCgP8/egF3cHOHYTSxaYAkoUX+b2iQfZj4Ng15mSQyPiUahuwFA9kDVucBkwmrc5qcUJQWb2AA7D7Jt/YAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______________3_1768430657908_uf7pp3pb1g8.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:44:21.119	2026-04-28 03:29:25.655
cmkem3hrv000zqsljy6pfj7op	기획실 2	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/________2_1768430895043_iai11o6nax.png	http://127.0.0.1:19000/posts/character/________2_1768430895043_iai11o6nax.svg	[{"url": "http://127.0.0.1:19000/posts/character/________2_1768430895043_iai11o6nax.svg", "name": "기획실2.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAATCAMAAACnUt2HAAAABlBMVEWGpLJqpMKlE2XKAAAAAnRSTlMnNmPs6sQAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAA9SURBVHicjc/BCgAwCAJQ/f+fHoxIIcey20MPgR0oQmMjxiYDIiFbf3N2dTEPzfUcpnJ/9LrVpHWDYx5cObOKAMHnHq9iAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/________2_1768430895043_iai11o6nax.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	기획실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:48:17.847	2026-04-28 03:29:25.657
cmkemewsy001lqslj3wzgy5ag	보안기술연구소 5	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_________________5_1768431427619_ytkppnr7nxc.png	http://127.0.0.1:19000/posts/character/_________________5_1768431427619_ytkppnr7nxc.svg	[{"url": "http://127.0.0.1:19000/posts/character/_________________5_1768431427619_ytkppnr7nxc.svg", "name": "보안기술연구소5.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAOCAMAAAAYGszCAAAADFBMVEWcpayIjpOerLiSm6ND7vOMAAAABHRSTlNYVWxGgaptggAAAAlwSFlzAAAPYQAAD2EBqD+naQAAAEZJREFUeJxtzVEOwDAIAlAo97/z0lmIbsUvXzBiOVioSAjagODuFQtIM9dbP1KZt8a+8MyfGDxrxQ8bkdAbqplxupE3HNUHmYEBNCVk+ssAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_________________5_1768431427619_ytkppnr7nxc.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안기술연구소	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:57:10.546	2026-04-28 03:29:25.66
cmkdfomi9001313vefmb2ai3r	D.AMO	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_b_1768359656423_1azxyzxdvlq.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_b_1768359656423_1azxyzxdvlq.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_b_1768359656423_1azxyzxdvlq.svg", "name": "D.AMO_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAGCAMAAAD0SU6vAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMNEamNk4cAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAYSURBVHicY2BEBgxQgCIIEyVTEJuZMDEAFYsAUUe0YoIAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_b_1768359656423_1azxyzxdvlq.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:01:00.273	2026-04-28 03:29:25.665
cmmtz8ggc0001bi0p88f7ttlf	Welcome Kit Bag	\N	\N	https://design5.pentasecurity.com/posts/penta-design/welcome_kit_bag_03_1773713518422_johrmr2mmlm.png	http://127.0.0.1:19000/posts/penta-design/welcome_kit_bag_01_1773713504833_hgckmzfooxj.png	[{"url": "http://127.0.0.1:19000/posts/penta-design/welcome_kit_bag_01_1773713504833_hgckmzfooxj.png", "name": "welcome kit_bag_01.png", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAKABQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAEG/8QAFRABAQAAAAAAAAAAAAAAAAAAAAH/xAAVAQEBAAAAAAAAAAAAAAAAAAABAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AN5UWhAKBP/Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/welcome_kit_bag_01_1773713504833_hgckmzfooxj.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/welcome_kit_bag_02_1773713512311_zvp5gatqw19.png", "name": "welcome kit_bag_02.png", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECBv/EABYQAQEBAAAAAAAAAAAAAAAAAAABEf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDpBayC6IA//9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/welcome_kit_bag_02_1773713512311_zvp5gatqw19.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/welcome_kit_bag_03_1773713518422_johrmr2mmlm.png", "name": "welcome kit_bag_03.png", "order": 2, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAIBBv/EABUQAQEAAAAAAAAAAAAAAAAAAAAB/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOlYqxIAAP/Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/welcome_kit_bag_03_1773713518422_johrmr2mmlm.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	23	0	\N	\N	2026-02-05 15:00:00	cmkdc777200001251hxs59lzx	cmkw65m0400007y0ic9c0hnjk	2026-03-17 02:12:01.702	2026-05-07 02:49:28.152
cmmtwqe950003l5ml6zgxdlvq	AWS Summit Seoul 2025	\N	\N	https://design5.pentasecurity.com/posts/penta-design/202503_AWS_Summit_Seoul_2025_eDM_1773709312932_u83eo1ijd6.jpg	http://127.0.0.1:19000/posts/penta-design/202503_AWS_Summit_Seoul_2025_eDM_1773709312932_u83eo1ijd6.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202503_AWS_Summit_Seoul_2025_eDM_1773709312932_u83eo1ijd6.jpg", "name": "202503_AWS Summit Seoul 2025_eDM.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAA4DASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIFAQP/xAAaEAACAwEBAAAAAAAAAAAAAAAAAQIDUWES/8QAFQEBAQAAAAAAAAAAAAAAAAAABAX/xAAWEQEBAQAAAAAAAAAAAAAAAAACAAP/2gAMAwEAAhEDEQA/AFjYdVaTY3dGV/SknTDnTlN6b7loAGUs3//Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202503_AWS_Summit_Seoul_2025_eDM_1773709312932_u83eo1ijd6.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/202503_AWS_Summit_Seoul_2025_Thank_you_eDM_1773709316963_5m7s49xtcba.jpg", "name": "202503_AWS Summit Seoul 2025_Thank you_eDM.jpg", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAwDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAMFAQL/xAAbEAADAAIDAAAAAAAAAAAAAAAAAQMCYRIhUf/EABUBAQEAAAAAAAAAAAAAAAAAAAQF/8QAFxEBAQEBAAAAAAAAAAAAAAAAAAIBA//aAAwDAQACEQMRAD8AXjUYq9ExW2dq+ynVJs805Zs3m/QAPpkv/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202503_AWS_Summit_Seoul_2025_Thank_you_eDM_1773709316963_5m7s49xtcba.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	4	0	\N	\N	2025-03-13 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:01:59.772	2026-04-28 03:29:25.697
cmojc8gnj000b137ncdbcqb4d	D.AMO Cloud	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_Cloud_1777423793459_bm4tm50ek18.png	http://127.0.0.1:19000/posts/posts/ci-bi/D_AMO_Cloud_1777423793459_bm4tm50ek18.svg	[{"url": "http://127.0.0.1:19000/posts/posts/ci-bi/D_AMO_Cloud_1777423793459_bm4tm50ek18.svg", "name": "D.AMO Cloud.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM7MGz4EqwAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAVSURBVHicY2BkZGRABowgARBCFwQAAUIADyKrsdsAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_Cloud_1777423793459_bm4tm50ek18.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-04-29 00:49:53.743	2026-04-29 00:49:53.743
cmmtxz10c0001s4blscgblp1l	D.AMO KMS v5.0 수상 소개	대한민국 소프트웨어대상 국무총리상 수상	\N	https://design5.pentasecurity.com/posts/penta-design/D_AMO_KMS_v5_0____________1773711392113_x7e4cnknhis.png	http://127.0.0.1:19000/posts/penta-design/D_AMO_KMS_v5_0____________1773711392113_x7e4cnknhis.png	[{"url": "http://127.0.0.1:19000/posts/penta-design/D_AMO_KMS_v5_0____________1773711392113_x7e4cnknhis.png", "name": "D.AMO KMS v5.0 수상 소개.png", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAsDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAIDBAb/xAAZEAEAAgMAAAAAAAAAAAAAAAAAAQIDEhP/xAAWAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAVEQEBAAAAAAAAAAAAAAAAAAAAEf/aAAwDAQACEQMRAD8Ay04yc1yak0DSJQAFv//Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/D_AMO_KMS_v5_0____________1773711392113_x7e4cnknhis.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/DID_1080x1920__5__1773711398653_57awbx5kvs4.png", "name": "DID_1080x1920 (5).png", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAsDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAECBv/EABgQAQEBAQEAAAAAAAAAAAAAAAABAhES/8QAFgEBAQEAAAAAAAAAAAAAAAAAAgAB/8QAFREBAQAAAAAAAAAAAAAAAAAAABH/2gAMAwEAAhEDEQA/AMZIryeYvipQsqAYT//Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/DID_1080x1920__5__1773711398653_57awbx5kvs4.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	15	0	\N	\N	2025-12-10 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:36:42.202	2026-05-07 01:11:44.256
cmkdfrrab001r13vexqiz8d3j	D.AMO KE	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/D_AMO_KE_b_1768359803529_c9xui8al8g.png	http://127.0.0.1:19000/posts/ci-bi/D_AMO_KE_b_1768359803529_c9xui8al8g.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/D_AMO_KE_b_1768359803529_c9xui8al8g.svg", "name": "D.AMO KE_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMzLykplVEAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAUSURBVHicY2CAAUYEgIshCxMvCAAGCQAnxDkWqAAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/D_AMO_KE_b_1768359803529_c9xui8al8g.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:03:26.435	2026-04-28 03:29:24.75
cmkdfydvw003013vejiuooc42	iSIGN PASS API	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_PASS_API_b_1768360112859_57ejyijp1rf.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_API_b_1768360112859_57ejyijp1rf.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_PASS_API_b_1768360112859_57ejyijp1rf.svg", "name": "iSIGN PASS API_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADCAMAAACkhN8cAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM5NFmjtDcAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAUSURBVHicY2BAAYxggCqETRCmEgACFQAUrsWEHAAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_PASS_API_b_1768360112859_57ejyijp1rf.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:08:35.66	2026-04-28 03:29:24.769
cmkdg30sp003s13vejcyzz2y6	iSIGN	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/iSIGN_b_1768360329144_iwebz3pmlz.png	http://127.0.0.1:19000/posts/ci-bi/iSIGN_b_1768360329144_iwebz3pmlz.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/iSIGN_b_1768360329144_iwebz3pmlz.svg", "name": "iSIGN_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAHCAMAAAA/FZ0KAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMRFUiXCsMAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAhSURBVHicY2BgYGBgRAIgPhhgE0QWwy9I0Ey4GLIomA8AGTcAVDdknF4AAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/iSIGN_b_1768360329144_iwebz3pmlz.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:12:11.977	2026-04-28 03:29:24.792
cmkdgd60g005r13ve72rc1ss3	Penta Smart Energy Security	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/Penta_Smart_Energy_Security_b_1768360802434_h6orbzp563a.png	http://127.0.0.1:19000/posts/ci-bi/Penta_Smart_Energy_Security_b_1768360802434_h6orbzp563a.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/Penta_Smart_Energy_Security_b_1768360802434_h6orbzp563a.svg", "name": "Penta Smart Energy Security_b.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAACCAMAAABv2Ay5AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlM+NvjsQ9wAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAATSURBVHicY2BAAEYGRghAFoMDAAEuABM+vgPhAAAAAElFTkSuQmCC", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/Penta_Smart_Energy_Security_b_1768360802434_h6orbzp563a.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	BI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 03:20:05.296	2026-04-28 03:29:24.831
cmmtzm4ux0007bi0p6kjr1o65	TuringSign MOU	글로벌 사업 확장 및 전략적 협력을 위한 업무협약	\N	https://design5.pentasecurity.com/posts/penta-design/coco_1920x1080_1773714145861_ic2rssv0lg.png	http://127.0.0.1:19000/posts/penta-design/coco_1920x1080_1773714145861_ic2rssv0lg.png	[{"url": "http://127.0.0.1:19000/posts/penta-design/coco_1920x1080_1773714145861_ic2rssv0lg.png", "name": "coco_1920x1080.png", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAABAADBf/EABgQAQEBAQEAAAAAAAAAAAAAAAABAgMh/8QAFwEAAwEAAAAAAAAAAAAAAAAAAgMFBv/EABcRAQADAAAAAAAAAAAAAAAAAAABAhH/2gAMAwEAAhEDEQA/AOTzpWNB8yMNNaEu0EzXiZSoGF4//9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/coco_1920x1080_1773714145861_ic2rssv0lg.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/did_384x640_1773714149692_uxgg4irkaq.png", "name": "did_384x640.png", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAwDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwQA/8QAFxAAAwEAAAAAAAAAAAAAAAAAAAECIf/EABYBAQEBAAAAAAAAAAAAAAAAAAIFBv/EABURAQEAAAAAAAAAAAAAAAAAAAEA/9oADAMBAAIRAxEAPwCOKFVYSTQqvDSJSEpZYieGMNm3/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/did_384x640_1773714149692_uxgg4irkaq.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/wall_01_1792x448_1773714153555_260cwax6v2v.png", "name": "wall_01_1792x448.png", "order": 2, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAFABQDASIAAhEBAxEB/8QAFwABAAMAAAAAAAAAAAAAAAAAAAMEBf/EABgQAQEAAwAAAAAAAAAAAAAAAAABAgMh/8QAFwEAAwEAAAAAAAAAAAAAAAAAAgMFBv/EABURAQEAAAAAAAAAAAAAAAAAAAAC/9oADAMBAAIRAxEAPwDI11ZwoNNSXSWXgAC3/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/wall_01_1792x448_1773714153555_260cwax6v2v.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/welcome_1920x1080_1773714157190_xbsnf3ym0oi.png", "name": "welcome_1920x1080.png", "order": 3, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAALABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAABAADBf/EABkQAQEBAAMAAAAAAAAAAAAAAAACAQMhMf/EABcBAAMBAAAAAAAAAAAAAAAAAAIDBQb/xAAXEQEAAwAAAAAAAAAAAAAAAAAAAQIR/9oADAMBAAIRAxEAPwDk8ekxQcEQ01oS7QVldJlniBheP//Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/welcome_1920x1080_1773714157190_xbsnf3ym0oi.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	50	0	\N	\N	2026-03-10 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 02:22:39.859	2026-05-07 02:49:24.775
cmkdhwtcx000bnvum7nxbpr9o	Penta Security CI - Vision	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/ci-bi/penta_ci_vision_1768363398970_fe38s3jdjq9.png	http://127.0.0.1:19000/posts/ci-bi/penta_ci_vision_1768363398970_fe38s3jdjq9.svg	[{"url": "http://127.0.0.1:19000/posts/ci-bi/penta_ci_vision_1768363398970_fe38s3jdjq9.svg", "name": "penta_ci_vision.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAMAAAC5ge+kAAAABlBMVEUtbqJZf5ztRhjsAAAAAnRSTlM1I3bFfvwAAAAJcEhZcwAAD2EAAA9hAag/p2kAAAAdSURBVHicY2BAAEYGRghAFoKJIQkyMGJVCVPICAAFPgAleAlbtwAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/ci-bi/penta_ci_vision_1768363398970_fe38s3jdjq9.png"}]	0	image	image/*	cmkdc6d920003flsw95vfyr5s	PUBLISHED	f	0	0	CI	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 04:03:21.629	2026-04-28 03:29:24.852
cmkdpjbws0007utpicl0ov0wv	보안기술을 연구하는 개발자	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_________________1_1768376206189_0q7au68nn9qq.png	http://127.0.0.1:19000/posts/character/_________________1_1768376206189_0q7au68nn9qq.svg	[{"url": "http://127.0.0.1:19000/posts/character/_________________1_1768376206189_0q7au68nn9qq.svg", "name": "보안기술연구소1.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAASCAMAAABsDg4iAAAAFVBMVEW5v8OmrbGSmZ15f4Owt7yMk5d7gYT4dmXaAAAAB3RSTlM9S1VbLD5NbU+FqQAAAAlwSFlzAAAPYQAAD2EBqD+naQAAAGFJREFUeJxdy0ESAyAIQ9EQGu5/5E5QK/Wzcd5EYPTZTcPhx3Ax+q6aTjj/e3YDZBwSAU3kYUkbGXS2VsSCXZvwZxQlvdgmlJ/JTCZZrIVVttZkldWYv8q92No4bE8fXNMv+34Dm4A+v+0AAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_________________1_1768376206189_0q7au68nn9qq.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안기술연구소	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 07:36:49.413	2026-04-28 03:29:24.872
cmkem0euh000jqsljvxe78bdf	인증보안사업본부 3	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_____________________3_1768430750657_h89kav1ttn.png	http://127.0.0.1:19000/posts/character/_____________________3_1768430750657_h89kav1ttn.svg	[{"url": "http://127.0.0.1:19000/posts/character/_____________________3_1768430750657_h89kav1ttn.svg", "name": "인증보안사업본부3.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAFVBMVEXd4OLd4eTd4ePd4uTd4ePd4eTd4uTKuijwAAAAB3RSTlPZV8dzs56Kfbwi2wAAAAlwSFlzAAAPYQAAD2EBqD+naQAAAF1JREFUeJx9ygkOwCAIRNHBwbn/kRuRKE1JX4zLR1gDP5HGtSWYsbI1ARvIU7ESqDeKhBqQNC/NiKWcyYo+fZu+K/JdtNEd7sNHEbGGzONE3GvccO0JasrBN8X3zgPk8wQ/HNFcFwAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_____________________3_1768430750657_h89kav1ttn.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인증보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:45:54.084	2026-04-28 03:29:24.892
cmkem28hn000tqsljdowl7scw	미래사업본부 4	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________4_1768430836091_kr31l6woea9.png	http://127.0.0.1:19000/posts/character/______________4_1768430836091_kr31l6woea9.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________4_1768430836091_kr31l6woea9.svg", "name": "미래사업본부4.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAUCAMAAAC3SZ14AAAADFBMVEXBzNLJ0tfS2d3a3uF3AvBCAAAABHRSTlMpO0tbqaOS7QAAAAlwSFlzAAAPYQAAD2EBqD+naQAAAE9JREFUeJyly0ESgAAIAkDE//+5EbSyuoUHhx0FfiU0jx53Ve8Yp0Xjmwq1GGTw/DY4Q9OLCjfJ0JLXL9xTsZlaZKKWucOWsk06w5YvSvIA748CEahfyO8AAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________4_1768430836091_kr31l6woea9.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	미래보안사업본부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:47:19.163	2026-04-28 03:29:24.912
cmkemay520019qslj3i4sd2au	품질관리실 3	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/______________3_1768431242711_hn32spvf6c4.png	http://127.0.0.1:19000/posts/character/______________3_1768431242711_hn32spvf6c4.svg	[{"url": "http://127.0.0.1:19000/posts/character/______________3_1768431242711_hn32spvf6c4.svg", "name": "품질관리실3.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAQCAMAAAAhxq8pAAAACVBMVEXf3d/m5ebs7Oyg/OLqAAAAA3RSTlNGUF0hAEWxAAAACXBIWXMAAA9hAAAPYQGoP6dpAAAAQUlEQVR4nK3OOw4AMAgCUOX+h25EGj9Dp7Lx1ESzT3HzLR42nJUpzf5SoQqGigDk4BqpazOpsJKbvO7hX8uE00IPZGsBDBlOv+UAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/______________3_1768431242711_hn32spvf6c4.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	품질관리실	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:54:05.648	2026-04-28 03:29:24.931
cmkemdt6k001fqsljmq9n43we	보안기술연구소 2	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_________________2_1768431375886_rpg3o7avy2l.png	http://127.0.0.1:19000/posts/character/_________________2_1768431375886_rpg3o7avy2l.svg	[{"url": "http://127.0.0.1:19000/posts/character/_________________2_1768431375886_rpg3o7avy2l.svg", "name": "보안기술연구소2.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAATCAMAAACnUt2HAAAAMFBMVEWPq7uarbmctMOuwMulyd2Qu9OsyNiSxuKwxdGKmaWYvdKWwNiyvsWNt8+PxOCRwtzWTP5qAAAAEHRSTlNNW2pyqnOWv4NBg49fXa6dnjGr6AAAAAlwSFlzAAAPYQAAD2EBqD+naQAAAHxJREFUeJyNzEkOAyEMRFFjA23cDPe/bcsDpCNlkVo+fRUAjFFKkXutNee8dHDw/g/FcIV+lSvPPDfiTrPvB16KaWOt9ZRpIBYJNVZMaCkbqgdiIRHmUGihRMIc7PhS5sqKniIRkTO0k5oaQwv1B5+jacfe+8EPxxxVX/wAOb0JVmKdpxwAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_________________2_1768431375886_rpg3o7avy2l.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	보안기술연구소	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:56:19.184	2026-04-28 03:29:24.936
cmkemg4hu001pqslj79vtvin0	인사부 3	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______3_1768431483968_vkg29o4iz68.png	http://127.0.0.1:19000/posts/character/_______3_1768431483968_vkg29o4iz68.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______3_1768431483968_vkg29o4iz68.svg", "name": "인사부3.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAATCAMAAACnUt2HAAAACVBMVEWPssaYrrqdpqsB7gy+AAAAA3RSTlM4R1wN67TrAAAACXBIWXMAAA9hAAAPYQGoP6dpAAAATUlEQVR4nJ2NwQ3AMAjEct5/6EqB0IO2n/qBFMuEtf6hp5D2nE6BuyJVc6ryhpD2BkT7kNT9CIGXRDfKDL2sMKXdLnn8y/pHOeRuzzYXpx0BLO7sqSgAAAAASUVORK5CYII=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______3_1768431483968_vkg29o4iz68.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	인사부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:58:07.158	2026-04-28 03:29:24.95
cmkemhd0b001vqslj2k3j6x0x	재경부 2	\N	\N	https://design5.pentasecurity.com/posts/thumbnails/posts/character/_______2_1768431541871_bdjav9scgo.png	http://127.0.0.1:19000/posts/character/_______2_1768431541871_bdjav9scgo.svg	[{"url": "http://127.0.0.1:19000/posts/character/_______2_1768431541871_bdjav9scgo.svg", "name": "재경부2.svg", "order": 0, "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAASCAMAAABsDg4iAAAAD1BMVEWXt8CatruJtMVqqshgpcWfYpoOAAAABXRSTlNEMVViUHFY03YAAAAJcEhZcwAAD2EAAA9hAag/p2kAAABcSURBVHicdc1bDsAgDANBx+T+Z66cRwkSuHyg0YrCLsMboe0AOoKc/ThniYchuG4ESVBX35hzePxxkDT5sGAXx3vk0ieKNIuw4sZVc2mhqmbhEWba5VjjtHu5/AM7swJXtGVM3QAAAABJRU5ErkJggg==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/character/_______2_1768431541871_bdjav9scgo.png"}]	0	image	image/*	cmkdc6dat0005flswtjd8rs6z	PUBLISHED	f	0	0	재경부	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-14 22:59:04.85	2026-04-28 03:29:24.957
cmkesbgze0003t4xpiz0j3lqn	WAPPLES CC	\N	\N	https://design5.pentasecurity.com/posts/wapples/WAPPLES_CC_Brochure_KR_251104_1768441344022_6v1hpbf0ezj.pdf	http://127.0.0.1:19000/posts/wapples/WAPPLES_CC_Brochure_KR_251104_1768441344022_6v1hpbf0ezj.pdf	[{"url": "http://127.0.0.1:19000/posts/wapples/WAPPLES_CC_Brochure_KR_251104_1768441344022_6v1hpbf0ezj.pdf", "name": "WAPPLES_CC_Brochure_KR_251104.pdf", "order": 0}]	0	image	image/*	cmkdc6dfw000bflsw1kajwbt2	PUBLISHED	f	0	0	WAPPLES CC	KR	2025-11-03 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 01:42:27.764	2026-04-28 03:29:24.972
cmkf1n7un00052grfw0ttlgn5	D.AMO Cloud	\N	\N	https://design5.pentasecurity.com/posts/damo/D_AMO_Cloud_Brochure_KR_241209_1768457010252_kdl6bnct43i.pdf	http://127.0.0.1:19000/posts/damo/D_AMO_Cloud_Brochure_KR_241209_1768457010252_kdl6bnct43i.pdf	[{"url": "http://127.0.0.1:19000/posts/damo/D_AMO_Cloud_Brochure_KR_241209_1768457010252_kdl6bnct43i.pdf", "name": "D.AMO_Cloud_Brochure_KR_241209.pdf", "order": 0}]	0	image	image/*	cmkdc6dgp000cflsw1k2j57jt	PUBLISHED	f	0	0	D.AMO Cloud	KR	2024-12-08 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-01-15 06:03:32.346	2026-04-28 03:29:25.004
cmkqfth2j000b2faojumzs4hc	factory	\N	\N	https://design5.pentasecurity.com/icons/1769145946259-factory.svg	http://127.0.0.1:19000/icons/1769145946259-factory.svg	[{"url": "http://127.0.0.1:19000/icons/1769145946259-factory.svg", "name": "factory.svg", "order": 0}]	597	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:25:46.611	2026-04-28 03:29:25.031
cmkqg1dlw0003ucuszhi2kziw	sensor	\N	\N	https://design5.pentasecurity.com/icons/1769146315230-sensor.svg	http://127.0.0.1:19000/icons/1769146315230-sensor.svg	[{"url": "http://127.0.0.1:19000/icons/1769146315230-sensor.svg", "name": "sensor.svg", "order": 0}]	817	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:31:55.557	2026-04-28 03:29:25.057
cmkqfsc9m00012faonath34de	cctv	\N	\N	https://design5.pentasecurity.com/icons/1769145892889-cctv.svg	http://127.0.0.1:19000/icons/1769145892889-cctv.svg	[{"url": "http://127.0.0.1:19000/icons/1769145892889-cctv.svg", "name": "cctv.svg", "order": 0}]	1014	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-23 05:24:53.914	2026-04-28 03:29:25.086
cmkus5e02000dy5pvrrgatwxh	view	\N	\N	https://design5.pentasecurity.com/icons/1769408522356-view.svg	http://127.0.0.1:19000/icons/1769408522356-view.svg	[{"url": "http://127.0.0.1:19000/icons/1769408522356-view.svg", "name": "view.svg", "order": 0}]	637	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-01-26 06:22:02.78	2026-04-28 03:29:25.116
cmmtx63dd00016phezxh6kdue	펜타시큐리티 AI 경진대회	with AI	\N	https://design5.pentasecurity.com/posts/penta-design/202506_DID_1080x1920_1773710045114_xuo02vcqlvh.jpg	http://127.0.0.1:19000/posts/penta-design/202506_DID_1080x1920_1773710045114_xuo02vcqlvh.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/202506_DID_1080x1920_1773710045114_xuo02vcqlvh.jpg", "name": "202506_DID_1080x1920.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAsDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIEAQX/xAAaEAACAwEBAAAAAAAAAAAAAAAAAQMTYQIR/8QAFgEBAQEAAAAAAAAAAAAAAAAABAID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAEC/9oADAMBAAIRAxEAPwDicw4PThcocGpwXNDailJG+IAMorT/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202506_DID_1080x1920_1773710045114_xuo02vcqlvh.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	11	0	\N	\N	2025-06-04 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:14:12.201	2026-04-28 03:29:25.148
cmmtxgxjm0003ov7j5t79oq4j	펜타시큐리티 글로벌 영향력 (2025)	\N	\N	https://design5.pentasecurity.com/posts/penta-design/did_02_aisa_1773710547692_7mbebo99u0q.png	http://127.0.0.1:19000/posts/penta-design/did_01_main_1773710542389_e6faecbdwcn.png	[{"url": "http://127.0.0.1:19000/posts/penta-design/did_01_main_1773710542389_e6faecbdwcn.png", "name": "did_01_main.png", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAsDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAIDBv/EABcQAQEBAQAAAAAAAAAAAAAAAAABAiH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANdlSThcxSQUuVQAf//Z", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/did_01_main_1773710542389_e6faecbdwcn.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/did_02_aisa_1773710547692_7mbebo99u0q.png", "name": "did_02_aisa.png", "order": 1, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAUAAsDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAwACBv/EABgQAQEBAQEAAAAAAAAAAAAAAAABAjEh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDq8mnB4hZPBWMGnEgf/9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/did_02_aisa_1773710547692_7mbebo99u0q.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/wall_01_main_1773710552173_8s1nnp4niyj.png", "name": "wall_01_main.png", "order": 2, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAFABQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMG/8QAFxABAQEBAAAAAAAAAAAAAAAAAAIBMf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A1ErQAqucAEf/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/wall_01_main_1773710552173_8s1nnp4niyj.jpg"}, {"url": "http://127.0.0.1:19000/posts/penta-design/wall_02_aisa_1773710555342_6hpt26iukws.png", "name": "wall_02_aisa.png", "order": 3, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAFABQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMG/8QAFxABAQEBAAAAAAAAAAAAAAAAAAECIf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0+F8AKvJwAR//9k=", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/wall_02_aisa_1773710555342_6hpt26iukws.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	6	0	\N	\N	2025-10-09 15:00:00	cmkdc777200001251hxs59lzx	cmkw65m0400007y0ic9c0hnjk	2026-03-17 01:22:37.904	2026-04-28 03:29:25.181
cmmty6mkb0005s4blx8sggn5a	Cyber Security & Cloud Expo	\N	\N	https://design5.pentasecurity.com/posts/penta-design/202601_Cyber_Security___Cloud_Expo__1773711753196_4ybaxj743ja.png	http://127.0.0.1:19000/posts/penta-design/202601_Cyber_Security___Cloud_Expo__1773711753196_4ybaxj743ja.png	[{"url": "http://127.0.0.1:19000/posts/penta-design/202601_Cyber_Security___Cloud_Expo__1773711753196_4ybaxj743ja.png", "name": "202601_Cyber Security & Cloud Expo_.png", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAMABQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQAE/8QAHRAAAgICAwEAAAAAAAAAAAAAAAECBAMREiEiQf/EABYBAQEBAAAAAAAAAAAAAAAAAAACA//EABYRAQEBAAAAAAAAAAAAAAAAAAAREv/aAAwDAQACEQMRAD8AOprTQ/SlrQBV+DNVvo0ymnceTyiMsJPiQhX/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/202601_Cyber_Security___Cloud_Expo__1773711753196_4ybaxj743ja.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	7	0	\N	\N	2026-01-08 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 01:42:36.73	2026-04-28 03:29:25.187
cmlg3oz4s0003vhm3kfkaeixq	smartphone-android	\N	\N	https://design5.pentasecurity.com/icons/1770697701946-smartphone-android.svg	http://127.0.0.1:19000/icons/1770697701946-smartphone-android.svg	[{"url": "http://127.0.0.1:19000/icons/1770697701946-smartphone-android.svg", "name": "smartphone-android.svg", "order": 0}]	618	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 04:28:22.108	2026-04-28 03:29:25.201
cmlg66njg0011wkjbqz03zcuq	net	\N	\N	https://design5.pentasecurity.com/icons/1770701885978-net.svg	http://127.0.0.1:19000/icons/1770701885978-net.svg	[{"url": "http://127.0.0.1:19000/icons/1770701885978-net.svg", "name": "net.svg", "order": 0}]	1047	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:06.124	2026-04-28 03:29:25.289
cmlg679d4001vwkjbzia7rhto	switch-l3	\N	\N	https://design5.pentasecurity.com/icons/1770701914287-switch-l3.svg	http://127.0.0.1:19000/icons/1770701914287-switch-l3.svg	[{"url": "http://127.0.0.1:19000/icons/1770701914287-switch-l3.svg", "name": "switch-l3.svg", "order": 0}]	1223	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-10 05:38:34.408	2026-04-28 03:29:25.32
cmlh9ol3m0005nw1wnsjc12uo	base-station3	\N	\N	https://design5.pentasecurity.com/icons/1770768227666-base-station3.svg	http://127.0.0.1:19000/icons/1770768227666-base-station3.svg	[{"url": "http://127.0.0.1:19000/icons/1770768227666-base-station3.svg", "name": "base-station3.svg", "order": 0}]	1028	svg	image/svg+xml	cmkdc6d9y0004flswzyhbpe3u	PUBLISHED	f	0	0	\N	\N	\N	cmkdc777200001251hxs59lzx	\N	2026-02-11 00:03:47.795	2026-04-28 03:29:25.349
cmmtzp8ma0001rtcnrlwrx1fn	KIBA 3단 리플렛	KIBA (한국산업단지 경영자협연합회)	\N	https://design5.pentasecurity.com/posts/penta-design/KIBA_3leaflet_1773714300533_qgu9b62kkld.jpg	http://127.0.0.1:19000/posts/penta-design/KIBA_3leaflet_1773714300533_qgu9b62kkld.jpg	[{"url": "http://127.0.0.1:19000/posts/penta-design/KIBA_3leaflet_1773714300533_qgu9b62kkld.jpg", "name": "KIBA_3leaflet.jpg", "order": 0, "blurDataURL": "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAASABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECBf/EABYQAQEBAAAAAAAAAAAAAAAAAAABEf/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A4Mi4SraIxYFoKRQBkAH/2Q==", "thumbnailUrl": "http://127.0.0.1:19000/posts/thumbnails/posts/penta-design/KIBA_3leaflet_1773714300533_qgu9b62kkld.jpg"}]	0	image	image/*	cmkdc6d870002flswkvpv0ptt	PUBLISHED	f	45	0	\N	\N	2026-03-15 15:00:00	cmkdc777200001251hxs59lzx	\N	2026-03-17 02:25:04.713	2026-05-15 07:38:47.899
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.tags (id, name, slug, "createdAt") FROM stdin;
cmkdcfymx000112518z20c9jb	글로벌	글로벌-1768354217241	2026-01-14 01:30:17.241
cmkdcfyol00021251c1ol2xqz	지도	지도-1768354217300	2026-01-14 01:30:17.301
cmkdffc79000013veg0nint6j	수상	수상-1768359227013	2026-01-14 02:53:47.013
cmkdffc8w000113ve8h6h71a1	대한민국	대한민국-1768359227072	2026-01-14 02:53:47.073
cmkdffca8000213ve5ybghygm	소프트웨어	소프트웨어-1768359227120	2026-01-14 02:53:47.121
cmkdffcbl000313vemz7lvpxs	최초	최초-1768359227169	2026-01-14 02:53:47.169
cmkdfi8r2000b13vedg4vkrtv	특허	특허-1768359362509	2026-01-14 02:56:02.51
cmkdfi8t5000c13vedma4buli	기술	기술-1768359362585	2026-01-14 02:56:02.586
cmkdfi8uq000d13vexo4me20f	템플릿	템플릿-1768359362642	2026-01-14 02:56:02.643
cmkdflafj000k13veuh8ficla	홈페이지	홈페이지-1768359504655	2026-01-14 02:58:24.655
cmkdflahn000l13ve8bnxk8d9	팝업	팝업-1768359504731	2026-01-14 02:58:24.732
cmkdfmuqr000r13ve7ogye52g	안전	안전-1768359577635	2026-01-14 02:59:37.635
cmkdfmusp000s13ve24fpei7t	암호화	암호화-1768359577704	2026-01-14 02:59:37.705
cmkdfmuuy000t13ve1xfc978l	D.AMO	d-amo-1768359577785	2026-01-14 02:59:37.786
cmkdfmuww000u13venmczpt7c	데이터	데이터-1768359577855	2026-01-14 02:59:37.856
cmkdfw4w2002i13veva03ukk3	iSIGN	isign-1768360010690	2026-01-14 03:06:50.691
cmkdg492o003v13ve8eativm6	Cloudbric	cloudbric-1768360389360	2026-01-14 03:13:09.361
cmkdg9m8j004w13vesjmqlumx	WAPPLES	wapples-1768360639699	2026-01-14 03:17:19.699
cmkdgbbnc005913ve2u0zdre3	etc	etc-1768360719288	2026-01-14 03:18:39.289
cmkx58aud0000tze6fbhg6ijb	WAF+	waf-1769551426021	2026-01-27 22:03:46.021
cmkx58aw30001tze61053ozo0	일본	일본-1769551426083	2026-01-27 22:03:46.083
cmkx58axi0002tze6z72qlo3d	IT Trend	it-trend-1769551426134	2026-01-27 22:03:46.134
cmm04n6dl0000jitz2bfcr8jo	Cloudflare	cloudflare-1771908621321	2026-02-24 04:50:21.322
cmm04n6ft0001jitzyuiykztt	연동	연동-1771908621401	2026-02-24 04:50:21.402
cmm05lrx700009npwnqjs8r5o	IT	it-1771910235547	2026-02-24 05:17:15.547
cmm05lryu00019npwoej5hqsx	Trend	trend-1771910235606	2026-02-24 05:17:15.606
cmm0699140000135mi9glshx0	DSS	dss-1771911330808	2026-02-24 05:35:30.809
cmm06992s0001135mdheorrzc	eDM	edm-1771911330868	2026-02-24 05:35:30.868
cmmo5a4tt0000buwdearnfqto	ai	ai-1773360880625	2026-03-13 00:14:40.626
cmmo5gf8y0005buwdyj38klww	개발	개발-1773361174066	2026-03-13 00:19:34.067
cmmo5gf9m0006buwd55ue1o7c	포스터	포스터-1773361174090	2026-03-13 00:19:34.09
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.users (id, email, name, password, avatar, role, "createdAt", "updatedAt") FROM stdin;
cmkdc6d6s0001flsw5ta5eihq	member@pentasecurity.com	테스트 회원	$2a$10$ohPd83bdKI7/dM411cG5duAAqdWHB1ui7N6AdSBwFWtBeXC50nFYm	\N	MEMBER	2026-01-14 01:22:49.541	2026-01-14 01:22:49.541
cmkw65m0400007y0ic9c0hnjk	jrsong@pentasecurity.com	송지록	\N	https://lh3.googleusercontent.com/a/ACg8ocISGqBwKDLWRLuHvp10FxgnEpU8IE3vu_RmAgxDAQIi-xZvhJI9=s96-c	ADMIN	2026-01-27 05:41:53.956	2026-01-27 05:47:28.987
cmkz4hc0o0000iacbcdubsdcq	hbtak@pentasecurity.com	탁혜별	\N	https://lh3.googleusercontent.com/a/ACg8ocJ3aTkWrjvVouheAbqyF_DVHEsbe6Admx57ievV7gGV475x5A=s96-c	MEMBER	2026-01-29 07:18:20.185	2026-01-29 07:18:20.185
cmlgb26no0002o5by3da67mvd	seoyeon@pentasecurity.com	Seo yeon Jung	\N	https://lh3.googleusercontent.com/a/ACg8ocLyRGFYs0utOqdbyHaWYiVLexqpWcvF9BtyUJ8sAmp9werjKw=s96-c	MEMBER	2026-02-10 07:54:35.7	2026-02-10 07:54:35.7
cmmy9l8oo0000wyrrd8t8zjgg	mclim@pentasecurity.com	임명철	\N	https://lh3.googleusercontent.com/a/ACg8ocJ8-_jlCddP0S-zbwaII3bHKHW1YoSYYD6rUC9HIRK9xvH6kIdb=s96-c	MEMBER	2026-03-20 02:12:59.064	2026-03-20 02:12:59.064
cmmy9nofg0001wyrrp199r94h	kbchoi@pentasecurity.com	최규빈	\N	https://lh3.googleusercontent.com/a/ACg8ocKXcs8eHEFTMyjnjFtcolLsTZwkxuf90AzgkdAXSmTL8wxDSMk=s96-c	MEMBER	2026-03-20 02:14:52.78	2026-03-20 02:14:52.78
cmmy9npby0002wyrr2vjtn1p2	jhmin@pentasecurity.com	민지홍	\N	https://lh3.googleusercontent.com/a/ACg8ocJHE5yNTE9OcccLsXdfwIPqOEnH5sClTwHo3y5P7uz2w2MGwQ=s96-c	MEMBER	2026-03-20 02:14:53.95	2026-03-20 02:14:53.95
cmn2gljzm0000nys5n3pzywr2	silee@pentasecurity.com	이소이	\N	https://lh3.googleusercontent.com/a/ACg8ocI-nCF3_cekrDMtA-akVlLqc1KZpCGkssLoaDdidkU7neq6brQ=s96-c	MEMBER	2026-03-23 00:40:15.731	2026-03-23 00:40:15.731
cmn459b9x00003w65pabramiu	jhoh@pentasecurity.com	오진혁	\N	https://lh3.googleusercontent.com/a/ACg8ocI-YSEqcimMKEdpgNWZ2QCYLkbY7HJt2ORRgWws2bFzL3dkSw=s96-c	MEMBER	2026-03-24 04:58:21.141	2026-03-24 04:58:21.141
cmn459fb30000m5vqbpu0v2jp	yjoh@pentasecurity.com	오연진	\N	https://lh3.googleusercontent.com/a/ACg8ocIaBnTDz6taKfLL2NYSyAiD3jr2ZxOPTSBMUSo5kPHeBhDTazaP=s96-c	MEMBER	2026-03-24 04:58:26.367	2026-03-24 04:58:26.367
cmn459lqn0001m5vqm8dewr9c	ejlee@pentasecurity.com	이어진	\N	https://lh3.googleusercontent.com/a/ACg8ocK45hBDEBcLxKwrpuwsefwgQDOXrMrm9HjdcigQMnDIHwPiJA=s96-c	MEMBER	2026-03-24 04:58:34.703	2026-03-24 04:58:34.703
cmn8kqzgx000010hy6yzx7gzk	jooyoung@pentasecurity.com	이주영	\N	https://lh3.googleusercontent.com/a/ACg8ocJQUGDRxTtJq0FFYoDaorRATRJGtoiWSuNPpBZ6r7aJoLzb7TE=s96-c	MEMBER	2026-03-27 07:23:04.594	2026-03-27 07:23:04.594
cmn8l8ozm000047isvfnj6h2i	ischoi@pentasecurity.com	최인서	\N	https://lh3.googleusercontent.com/a/ACg8ocKrZaHVjULc28OH9Yk0rxD5hpuyrMMDp2Mz-8rMYQOKwwZYW7E=s96-c	MEMBER	2026-03-27 07:36:50.818	2026-03-27 07:36:50.818
cmnh39a7z0000297li5bwdjhm	inhochoi@pentasecurity.com	최인호	\N	https://lh3.googleusercontent.com/a/ACg8ocKHKJxGwGPYo_sXtNkLHtKDnOXE28xeWwkOPS1m79R0DD84WA=s96-c	MEMBER	2026-04-02 06:23:20.832	2026-04-02 06:23:20.832
cmno60qjk0002141g9xaljx6k	tjjung@pentasecurity.com	정태준	\N	https://lh3.googleusercontent.com/a/ACg8ocKElnb3TqdLapt4qmjlndu4VwMhBFA61LiyjTNi1keDFSIxIw=s96-c	MEMBER	2026-04-07 05:15:04.16	2026-04-07 05:15:04.16
cmnxxepq70000og52o20gnbww	jsmoon@pentasecurity.com	문준수	\N	https://lh3.googleusercontent.com/a/ACg8ocIn42y2vLvdeXq20-XnfpEXXoWW2alS38C71nEDTozG8b7ItQ=s96-c	MEMBER	2026-04-14 01:11:41.504	2026-04-14 01:11:41.504
cmkdc777200001251hxs59lzx	tiper@pentasecurity.com	최용석	\N	http://127.0.0.1:19000/avatars/avatars/cmkdc777200001251hxs59lzx-1771487406135.png	ADMIN	2026-01-14 01:23:28.43	2026-04-29 03:29:06.098
cmkdc6d3d0000flswpia9yadn	admin@pentasecurity.com	관리자	$2a$10$ddnejygg6scBQqQgUAXiIuHoazr8lEmTyFP7/mGEIEh8wdU1n7CBq	\N	ADMIN	2026-01-14 01:22:49.418	2026-04-29 04:39:29.426
\.


--
-- Data for Name: welcomeboard_templates; Type: TABLE DATA; Schema: public; Owner: design5
--

COPY public.welcomeboard_templates (id, name, description, "thumbnailUrl", "backgroundUrl", width, height, config, status, "authorId", "createdAt", "updatedAt") FROM stdin;
cmkx6nsdr0001daw9s196caie	Live Release 템플릿	제품 Live Release 용	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769553825116_g_1769553825754_zurrh2ymt7k.png	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769553825116_g_1769553825754_zurrh2ymt7k.png	1920	1080	{"textElements": [{"x": 57, "y": 27, "id": "welcome", "color": "#000000", "label": "환영문", "width": 80, "editable": true, "fontSize": 51, "textAlign": "right", "fontWeight": "medium", "defaultValue": "Encryption, done it?", "verticalAlign": "middle"}, {"x": 58, "y": 27, "id": "penta", "color": "#000000", "label": "제품명", "width": 80, "editable": true, "fontSize": 51, "textAlign": "left", "fontWeight": "extrabold", "defaultValue": "D.AMO", "verticalAlign": "middle"}, {"x": 50, "y": 40, "id": "visitorInfo", "color": "#000000", "label": "제품군", "width": 80, "editable": true, "fontSize": 95, "textAlign": "center", "fontWeight": "extrabold", "defaultValue": "D.AMO Control Center", "verticalAlign": "middle"}, {"x": 50, "y": 67, "id": "welcomeMessage", "color": "#00B0F0", "label": "릴리즈명", "width": 80, "editable": true, "fontSize": 60, "textAlign": "center", "fontWeight": "medium", "defaultValue": "Live Release", "verticalAlign": "middle"}, {"x": 50, "y": 84, "id": "datetime", "color": "#000000", "label": "일시", "width": 60, "editable": true, "fontSize": 28, "textAlign": "center", "fontWeight": "medium", "defaultValue": "2026년 1월 15일 (월)", "verticalAlign": "middle"}, {"x": 50, "y": 49, "id": "location", "color": "#000000", "label": "버전", "width": 60, "editable": true, "fontSize": 55, "textAlign": "center", "fontWeight": "extrabold", "defaultValue": "v4.0.304", "verticalAlign": "middle"}]}	PUBLISHED	cmkdc777200001251hxs59lzx	2026-01-27 22:43:48.072	2026-04-28 03:29:25.714
cmkxaa2uo00011tav57qwz4bd	웨이브 타입 템플릿	오렌지 계열, 중앙 정렬	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769559903658_i_1769559904288_g38s9wbqops.png	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769559903658_i_1769559904288_g38s9wbqops.png	1920	1080	{"logoArea": {"x": 50, "y": 28, "width": 400, "height": 130, "placeholder": "방문사 로고"}, "textElements": [{"x": 36, "y": 13, "id": "welcome", "color": "#000000", "label": "환영문", "width": 80, "editable": false, "fontSize": 41, "textAlign": "left", "fontWeight": "medium", "defaultValue": "Welcome to", "verticalAlign": "middle"}, {"x": 48, "y": 13, "id": "penta", "color": "#000000", "label": "펜타", "width": 80, "editable": false, "fontSize": 41, "textAlign": "left", "fontWeight": "extrabold", "defaultValue": "PentaSecurity", "verticalAlign": "middle"}, {"x": 50, "y": 46, "id": "visitorInfo", "color": "#000000", "label": "방문사 정보", "width": 80, "editable": true, "fontSize": 86, "textAlign": "center", "fontWeight": "medium", "defaultValue": "서울디지털재단 홍길동 이사장님,", "verticalAlign": "middle"}, {"x": 50, "y": 58, "id": "welcomeMessage", "color": "#000000", "label": "환영 메시지", "width": 80, "editable": true, "fontSize": 86, "textAlign": "center", "fontWeight": "medium", "defaultValue": "방문을 환영합니다.", "verticalAlign": "middle"}, {"x": 39, "y": 82, "id": "datetime", "color": "#000000", "label": "일시", "width": 60, "editable": true, "fontSize": 36, "textAlign": "left", "fontWeight": "medium", "defaultValue": "일시 | 2024년 6월 1일 (월)", "verticalAlign": "middle"}, {"x": 39, "y": 87, "id": "location", "color": "#000000", "label": "장소", "width": 60, "editable": true, "fontSize": 36, "textAlign": "left", "fontWeight": "medium", "defaultValue": "장소 | 9F, COCO", "verticalAlign": "middle"}]}	PUBLISHED	cmkdc777200001251hxs59lzx	2026-01-28 00:25:06.942	2026-04-28 03:29:25.716
cmkw7oa8j0001gf8ok02ryxm8	빌딩 템플릿	좌측 정렬 템플릿	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769496017817________1769496017874_mearzhi0keo.png	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769496017817________1769496017874_mearzhi0keo.png	1920	1080	{"logoArea": {"x": 15, "y": 28, "width": 400, "height": 120, "placeholder": "방문사 로고"}, "textElements": [{"x": 4, "y": 11, "id": "welcome", "color": "#000000", "label": "환영문", "width": 80, "editable": false, "fontSize": 48, "textAlign": "left", "fontWeight": "medium", "defaultValue": "Welcome to", "verticalAlign": "middle"}, {"x": 27, "y": 11, "id": "penta", "color": "#000000", "label": "펜타", "width": 80, "editable": false, "fontSize": 48, "textAlign": "center", "fontWeight": "extrabold", "defaultValue": "PentaSecurity", "verticalAlign": "middle"}, {"x": 4, "y": 44, "id": "visitorInfo", "color": "#000000", "label": "방문사 정보", "width": 80, "editable": true, "fontSize": 95, "textAlign": "left", "fontWeight": "medium", "defaultValue": "서울디지털재단 홍길동 이사장님,", "verticalAlign": "middle"}, {"x": 4, "y": 57, "id": "welcomeMessage", "color": "#000000", "label": "환영 메시지", "width": 80, "editable": true, "fontSize": 95, "textAlign": "left", "fontWeight": "medium", "defaultValue": "방문을 환영합니다.", "verticalAlign": "middle"}, {"x": 4, "y": 86, "id": "datetime", "color": "#000000", "label": "일시", "width": 60, "editable": true, "fontSize": 42, "textAlign": "left", "fontWeight": "medium", "defaultValue": "일시 | 2024년 6월 1일 (월)", "verticalAlign": "middle"}, {"x": 4, "y": 91, "id": "location", "color": "#000000", "label": "장소", "width": 60, "editable": true, "fontSize": 42, "textAlign": "left", "fontWeight": "medium", "defaultValue": "장소 | 9F, COCO", "verticalAlign": "middle"}]}	PUBLISHED	cmkdc777200001251hxs59lzx	2026-01-27 06:24:24.656	2026-04-28 03:29:25.722
cmkxb59ow00051tav4krto7xe	블랙 템플릿	기본 템플릿 - 검정	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769561360499_black_1769561360541_wi58qlvepqk.png	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769561360499_black_1769561360541_wi58qlvepqk.png	1920	1080	{"logoArea": {"x": 86, "y": 21, "width": 400, "height": 130, "placeholder": "방문사 로고"}, "textElements": [{"x": 3, "y": 18, "id": "welcome", "color": "#ffffff", "label": "환영문", "width": 80, "editable": true, "fontSize": 65, "textAlign": "left", "fontWeight": "medium", "defaultValue": "Welcome to", "verticalAlign": "middle"}, {"x": 3, "y": 28, "id": "penta", "color": "#ffffff", "label": "펜타", "width": 80, "editable": true, "fontSize": 130, "textAlign": "left", "fontWeight": "extrabold", "defaultValue": "PentaSecurity", "verticalAlign": "middle"}, {"x": 3, "y": 49, "id": "visitorInfo", "color": "#ffffff", "label": "방문사 정보", "width": 80, "editable": true, "fontSize": 80, "textAlign": "left", "fontWeight": "medium", "defaultValue": "서울디지털재단 홍길동 이사장님,", "verticalAlign": "middle"}, {"x": 3, "y": 59, "id": "welcomeMessage", "color": "#ffffff", "label": "환영 메시지", "width": 80, "editable": true, "fontSize": 80, "textAlign": "left", "fontWeight": "medium", "defaultValue": "방문을 환영합니다.", "verticalAlign": "middle"}, {"x": 3, "y": 88, "id": "datetime", "color": "#ffffff", "label": "일시", "width": 60, "editable": true, "fontSize": 40, "textAlign": "left", "fontWeight": "medium", "defaultValue": "일시 | 2024년 6월 1일 (월)", "verticalAlign": "middle"}, {"x": 3, "y": 93, "id": "location", "color": "#ffffff", "label": "장소", "width": 60, "editable": true, "fontSize": 40, "textAlign": "left", "fontWeight": "medium", "defaultValue": "장소 | 9F, COCO", "verticalAlign": "middle"}]}	PUBLISHED	cmkdc777200001251hxs59lzx	2026-01-28 00:49:22.141	2026-04-28 03:29:25.724
cmkw2lb7900011r1moa052fao	육각 도형 패턴 템플릿	중앙 정렬 템플릿	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769486524507_a_1769486525122_ybv0iwrevgh.png	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769486524507_a_1769486525122_ybv0iwrevgh.png	1920	1080	{"logoArea": {"x": 49, "y": 29, "width": 400, "height": 130, "placeholder": "방문사 로고"}, "textElements": [{"x": 47, "y": 12, "id": "welcome", "color": "#000000", "label": "환영문", "width": 80, "editable": false, "fontSize": 47, "textAlign": "right", "fontWeight": "medium", "defaultValue": "Welcome to", "verticalAlign": "middle"}, {"x": 48, "y": 12, "id": "penta", "color": "#000000", "label": "펜타", "width": 80, "editable": false, "fontSize": 47, "textAlign": "left", "fontWeight": "extrabold", "defaultValue": "PentaSecurity", "verticalAlign": "middle"}, {"x": 49, "y": 47, "id": "visitorInfo", "color": "#000000", "label": "방문사 정보", "width": 80, "editable": true, "fontSize": 88, "textAlign": "center", "fontWeight": "medium", "defaultValue": "서울디지털재단 홍길동 이사장님,", "verticalAlign": "middle"}, {"x": 49, "y": 60, "id": "welcomeMessage", "color": "#000000", "label": "환영 메시지", "width": 80, "editable": true, "fontSize": 88, "textAlign": "center", "fontWeight": "medium", "defaultValue": "방문을 환영합니다.", "verticalAlign": "middle"}, {"x": 38, "y": 80, "id": "datetime", "color": "#000000", "label": "일시", "width": 60, "editable": true, "fontSize": 40, "textAlign": "left", "fontWeight": "medium", "defaultValue": "일시 | 2024년 6월 1일 (월)", "verticalAlign": "middle"}, {"x": 38, "y": 85, "id": "location", "color": "#000000", "label": "장소", "width": 60, "editable": true, "fontSize": 40, "textAlign": "left", "fontWeight": "medium", "defaultValue": "장소 | 9F, COCO", "verticalAlign": "middle"}]}	PUBLISHED	cmkdc777200001251hxs59lzx	2026-01-27 04:02:07.813	2026-04-28 03:29:25.709
cmkxbecej00071tavtna4x1ol	화이트 템플릿	기본 템플릿 - 화이트	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769561783806_white_1769561783850_ruylufvruuo.png	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769561783806_white_1769561783850_ruylufvruuo.png	1920	1080	{"logoArea": {"x": 82, "y": 25, "width": 400, "height": 130, "placeholder": "방문사 로고"}, "textElements": [{"x": 3, "y": 18, "id": "welcome", "color": "#000000", "label": "환영문", "width": 80, "editable": true, "fontSize": 65, "textAlign": "left", "fontWeight": "medium", "defaultValue": "Welcome to", "verticalAlign": "middle"}, {"x": 3, "y": 28, "id": "penta", "color": "#000000", "label": "펜타", "width": 80, "editable": true, "fontSize": 135, "textAlign": "left", "fontWeight": "extrabold", "defaultValue": "PentaSecurity", "verticalAlign": "middle"}, {"x": 3, "y": 50, "id": "visitorInfo", "color": "#000000", "label": "방문사 정보", "width": 80, "editable": true, "fontSize": 72, "textAlign": "left", "fontWeight": "medium", "defaultValue": "서울디지털재단 홍길동 이사장님, 방문을 환영합니다.", "verticalAlign": "middle"}, {"x": 3, "y": 87, "id": "datetime", "color": "#000000", "label": "일시", "width": 60, "editable": true, "fontSize": 40, "textAlign": "left", "fontWeight": "medium", "defaultValue": "일시 | 2024년 6월 1일 (월)", "verticalAlign": "middle"}, {"x": 3, "y": 92, "id": "location", "color": "#000000", "label": "장소", "width": 60, "editable": true, "fontSize": 40, "textAlign": "left", "fontWeight": "medium", "defaultValue": "장소 | 9F, COCO", "verticalAlign": "middle"}]}	PUBLISHED	cmkdc777200001251hxs59lzx	2026-01-28 00:56:25.534	2026-04-28 03:29:25.719
cmkxalha000031tavriuoecj0	삼각 패턴 템플릿	네트워크 컨셉 템플릿	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769560436471_j_1769560436514_vwi4kwt0ssi.png	http://127.0.0.1:19000/posts/welcomeboard/welcomeboard_bg_1769560436471_j_1769560436514_vwi4kwt0ssi.png	1920	1080	{"logoArea": {"x": 50, "y": 31, "width": 400, "height": 130, "placeholder": "방문사 로고"}, "textElements": [{"x": 48, "y": 17, "id": "welcome", "color": "#000000", "label": "환영문", "width": 80, "editable": false, "fontSize": 38, "textAlign": "right", "fontWeight": "medium", "defaultValue": "Welcome to", "verticalAlign": "middle"}, {"x": 49, "y": 17, "id": "penta", "color": "#000000", "label": "펜타", "width": 80, "editable": false, "fontSize": 38, "textAlign": "left", "fontWeight": "extrabold", "defaultValue": "PentaSecurity", "verticalAlign": "middle"}, {"x": 50, "y": 48, "id": "visitorInfo", "color": "#000000", "label": "방문사 정보", "width": 80, "editable": true, "fontSize": 95, "textAlign": "center", "fontWeight": "medium", "defaultValue": "서울디지털재단 홍길동 이사장님,", "verticalAlign": "middle"}, {"x": 50, "y": 61, "id": "welcomeMessage", "color": "#000000", "label": "환영 메시지", "width": 80, "editable": true, "fontSize": 95, "textAlign": "center", "fontWeight": "medium", "defaultValue": "방문을 환영합니다.", "verticalAlign": "middle"}, {"x": 39, "y": 80, "id": "datetime", "color": "#000000", "label": "일시", "width": 60, "editable": true, "fontSize": 36, "textAlign": "left", "fontWeight": "medium", "defaultValue": "일시 | 2024년 6월 1일 (월)", "verticalAlign": "middle"}, {"x": 39, "y": 85, "id": "location", "color": "#000000", "label": "장소", "width": 60, "editable": true, "fontSize": 36, "textAlign": "left", "fontWeight": "medium", "defaultValue": "장소 | 9F, COCO", "verticalAlign": "middle"}]}	PUBLISHED	cmkdc777200001251hxs59lzx	2026-01-28 00:33:58.823	2026-04-28 03:29:25.727
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: design5
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-01-02 03:45:13
20211116045059	2026-01-02 03:45:13
20211116050929	2026-01-02 03:45:14
20211116051442	2026-01-02 03:45:15
20211116212300	2026-01-02 03:45:16
20211116213355	2026-01-02 03:45:16
20211116213934	2026-01-02 03:45:17
20211116214523	2026-01-02 03:45:18
20211122062447	2026-01-02 03:45:19
20211124070109	2026-01-02 03:45:19
20211202204204	2026-01-02 03:45:20
20211202204605	2026-01-02 03:45:21
20211210212804	2026-01-02 03:45:23
20211228014915	2026-01-02 03:45:24
20220107221237	2026-01-02 03:45:25
20220228202821	2026-01-02 03:45:25
20220312004840	2026-01-02 03:45:26
20220603231003	2026-01-02 03:45:27
20220603232444	2026-01-02 03:45:28
20220615214548	2026-01-02 03:45:29
20220712093339	2026-01-02 03:45:29
20220908172859	2026-01-02 03:45:30
20220916233421	2026-01-02 03:45:31
20230119133233	2026-01-02 03:45:32
20230128025114	2026-01-02 03:45:33
20230128025212	2026-01-02 03:45:34
20230227211149	2026-01-02 03:45:34
20230228184745	2026-01-02 03:45:35
20230308225145	2026-01-02 03:45:36
20230328144023	2026-01-02 03:45:37
20231018144023	2026-01-02 03:45:38
20231204144023	2026-01-02 03:45:39
20231204144024	2026-01-02 03:45:40
20231204144025	2026-01-02 03:45:41
20240108234812	2026-01-02 03:45:42
20240109165339	2026-01-02 03:45:43
20240227174441	2026-01-02 03:45:45
20240311171622	2026-01-02 03:45:47
20240321100241	2026-01-02 03:45:49
20240401105812	2026-01-02 03:45:52
20240418121054	2026-01-02 03:45:53
20240523004032	2026-01-02 03:45:57
20240618124746	2026-01-02 03:45:58
20240801235015	2026-01-02 03:45:59
20240805133720	2026-01-02 03:46:00
20240827160934	2026-01-02 03:46:01
20240919163303	2026-01-02 03:46:02
20240919163305	2026-01-02 03:46:03
20241019105805	2026-01-02 03:46:03
20241030150047	2026-01-02 03:46:07
20241108114728	2026-01-02 03:46:08
20241121104152	2026-01-02 03:46:08
20241130184212	2026-01-02 03:46:09
20241220035512	2026-01-02 03:46:10
20241220123912	2026-01-02 03:46:11
20241224161212	2026-01-02 03:46:11
20250107150512	2026-01-02 03:46:12
20250110162412	2026-01-02 03:46:13
20250123174212	2026-01-02 03:46:13
20250128220012	2026-01-02 03:46:14
20250506224012	2026-01-02 03:46:15
20250523164012	2026-01-02 03:46:15
20250714121412	2026-01-02 03:46:16
20250905041441	2026-01-02 03:46:17
20251103001201	2026-01-02 03:46:17
20251120212548	2026-02-04 07:22:41
20251120215549	2026-02-04 07:22:42
20260218120000	2026-03-05 06:47:05
20260326120000	2026-04-15 01:54:01
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: design5
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: design5
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
avatars	avatars	\N	2026-01-03 14:45:50.311989+00	2026-01-03 14:45:50.311989+00	t	f	\N	\N	\N	STANDARD
ppt-thumbnails	ppt-thumbnails	\N	2026-01-16 03:03:54.259782+00	2026-01-16 03:03:54.259782+00	t	f	\N	\N	\N	STANDARD
icons	icons	\N	2026-01-21 23:07:43.711304+00	2026-01-21 23:07:43.711304+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: design5
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: design5
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: design5
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-01-02 03:45:11.913331
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-01-02 03:45:11.925236
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-01-02 03:45:11.956832
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-01-02 03:45:12.003814
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-01-02 03:45:12.009484
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-01-02 03:45:12.020443
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-01-02 03:45:12.028112
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-01-02 03:45:12.046591
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-01-02 03:45:12.052889
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-01-02 03:45:12.059865
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-01-02 03:45:12.065058
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-01-02 03:45:12.087988
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-01-02 03:45:12.094409
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-01-02 03:45:12.099769
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-01-02 03:45:12.107187
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-01-02 03:45:12.11395
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-01-02 03:45:12.119463
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-01-02 03:45:12.126545
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-01-02 03:45:12.140557
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-01-02 03:45:12.152475
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-01-02 03:45:12.158333
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-01-02 03:45:12.164106
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-01-02 03:45:13.27881
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-01-02 03:45:13.326932
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-01-02 03:45:13.332284
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-01-02 03:45:13.345751
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-01-02 03:45:13.351162
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-01-02 03:45:13.370779
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-01-02 03:45:11.932367
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-01-02 03:45:12.015079
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-01-02 03:45:12.033453
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-01-02 03:45:12.0401
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-01-02 03:45:12.169413
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-01-02 03:45:12.183348
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-01-02 03:45:12.715438
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-01-02 03:45:12.721185
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-01-02 03:45:12.726584
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-01-02 03:45:13.241728
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-01-02 03:45:13.249173
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-01-02 03:45:13.256958
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-01-02 03:45:13.259133
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-01-02 03:45:13.265547
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-01-02 03:45:13.271205
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-01-02 03:45:13.284663
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-01-02 03:45:13.29441
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-01-02 03:45:13.299663
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-01-02 03:45:13.308163
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-01-02 03:45:13.314398
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-01-02 03:45:13.321171
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-01-02 03:45:13.355904
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-01-28 22:23:05.565791
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-01-28 22:23:05.721881
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-01-28 22:23:05.893794
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-01-28 22:23:05.895124
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-01-28 22:23:05.895988
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-01-28 22:23:05.722813
56	fix-optimized-search-function	cb58526ebc23048049fd5bf2fd148d18b04a2073	2026-02-06 10:05:37.495257
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-02 06:06:38.160166
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-02 06:06:38.195546
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: design5
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
aa098244-6522-47de-a4e1-840d2a5277b9	icons	1769145946259-factory.svg	\N	2026-01-23 05:25:46.474082+00	2026-01-23 05:25:46.474082+00	2026-01-23 05:25:46.474082+00	{"eTag": "\\"b9d203e7b5eca05a88684812081cb264\\"", "size": 597, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:25:47.000Z", "contentLength": 597, "httpStatusCode": 200}	eafa4b7b-fda8-4330-a2a5-fc15c6c426b9	\N	{}
3bf28a58-df6b-48e1-bceb-8d7e022862a5	avatars	avatars/.emptyFolderPlaceholder	\N	2026-01-03 15:25:52.214194+00	2026-01-03 15:25:52.214194+00	2026-01-03 15:25:52.214194+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2026-01-03T15:25:52.210Z", "contentLength": 0, "httpStatusCode": 200}	18a7cf28-5121-4565-8c6c-657842db7bd7	\N	{}
11d05dfe-77d0-428e-a668-f56948ddf25e	icons	1770702189315-developer.svg	\N	2026-02-10 05:43:09.448216+00	2026-02-10 05:43:09.448216+00	2026-02-10 05:43:09.448216+00	{"eTag": "\\"491586ec146949d70ba364007314840b\\"", "size": 875, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:43:10.000Z", "contentLength": 875, "httpStatusCode": 200}	6d1aea8d-151a-4085-a6b8-2c28110b0073	\N	{}
5a9d98a3-b79c-4435-ac71-6c78e284d4b6	icons	1769143594338-bag.svg	\N	2026-01-23 04:46:34.744772+00	2026-01-23 04:46:34.744772+00	2026-01-23 04:46:34.744772+00	{"eTag": "\\"e02c3f1e85bfb01927d3c80a4b3198ed\\"", "size": 690, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T04:46:35.000Z", "contentLength": 690, "httpStatusCode": 200}	d0c9a785-ee7b-40d4-9e6b-6ff4c75926a0	\N	{}
65472559-d23c-407c-957f-0eb4ed670424	ppt-thumbnails	.emptyFolderPlaceholder	\N	2026-01-16 04:26:56.124951+00	2026-01-16 04:26:56.124951+00	2026-01-16 04:26:56.124951+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2026-01-16T04:26:56.132Z", "contentLength": 0, "httpStatusCode": 200}	42e728d1-2961-4a1e-addf-2b14161bf79c	\N	{}
efeaada9-0371-4884-acbf-793323393472	icons	1769121984184-amo_token.svg	\N	2026-01-22 22:46:24.289578+00	2026-01-22 22:46:24.289578+00	2026-01-22 22:46:24.289578+00	{"eTag": "\\"d9f649833a081d46ca26624ad105ea8e\\"", "size": 971, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:46:25.000Z", "contentLength": 971, "httpStatusCode": 200}	be0d6974-8464-47aa-abd7-ba10ca7196ea	\N	{}
c29267b3-d6c4-4ce6-9787-6edf2a06c713	icons	1769145948814-home-cam.svg	\N	2026-01-23 05:25:49.395002+00	2026-01-23 05:25:49.395002+00	2026-01-23 05:25:49.395002+00	{"eTag": "\\"b2166c417762dbed619ba28e510d6c91\\"", "size": 701, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:25:50.000Z", "contentLength": 701, "httpStatusCode": 200}	082d4828-cea0-4515-8b18-403e62eb9194	\N	{}
a9301fdb-a572-45c5-83f1-6d61ffe95d41	icons	1769145951553-home-control.svg	\N	2026-01-23 05:25:51.76274+00	2026-01-23 05:25:51.76274+00	2026-01-23 05:25:51.76274+00	{"eTag": "\\"efb0f6a23bd4848fa136c176d52782e2\\"", "size": 796, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:25:52.000Z", "contentLength": 796, "httpStatusCode": 200}	35d7d7ee-adda-4191-99ff-1d96a920ddba	\N	{}
aa99987d-cceb-42cf-af2a-630cdb94930d	icons	1770702357435-partner.svg	\N	2026-02-10 05:45:57.843379+00	2026-02-10 05:45:57.843379+00	2026-02-10 05:45:57.843379+00	{"eTag": "\\"6cf7ee0c4ff570481747aba258650ee9\\"", "size": 1232, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:45:58.000Z", "contentLength": 1232, "httpStatusCode": 200}	bb4989cc-a32a-4430-9a25-24c7e62ef635	\N	{}
b5fcfa27-1c61-4a0c-a8af-0f2fead282bc	icons	1769145953923-life.svg	\N	2026-01-23 05:25:54.098875+00	2026-01-23 05:25:54.098875+00	2026-01-23 05:25:54.098875+00	{"eTag": "\\"29a4b7c309dc24deba5ff28199732446\\"", "size": 1485, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:25:55.000Z", "contentLength": 1485, "httpStatusCode": 200}	61f31a2d-ef4a-4cbf-9fbb-29eca69b4ceb	\N	{}
74770b4b-c684-4bbd-ac9f-5f863e367298	icons	1769145956257-light.svg	\N	2026-01-23 05:25:56.439006+00	2026-01-23 05:25:56.439006+00	2026-01-23 05:25:56.439006+00	{"eTag": "\\"6584e1daa89bdd6bbe735ee533f69549\\"", "size": 615, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:25:57.000Z", "contentLength": 615, "httpStatusCode": 200}	d7c3bf4c-b15b-42f1-95be-90de6b50d18a	\N	{}
bbb190a0-d88e-4979-b2b7-2f5ed5c89227	icons	1770768378846-plane1.svg	\N	2026-02-11 00:06:18.931013+00	2026-02-11 00:06:18.931013+00	2026-02-11 00:06:18.931013+00	{"eTag": "\\"dff0258a04abc15b315dae7dc17da4eb\\"", "size": 601, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:19.000Z", "contentLength": 601, "httpStatusCode": 200}	ecd1663c-7c00-4c0f-8bf7-2a4a620f47ac	\N	{}
1a8b3a89-72a4-4ae6-81c4-fdc0e34cc360	icons	1769146041820-mechanical-devices-1.svg	\N	2026-01-23 05:27:22.106537+00	2026-01-23 05:27:22.106537+00	2026-01-23 05:27:22.106537+00	{"eTag": "\\"778e6dfb95b59b815551374e6f7f3c7a\\"", "size": 1226, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:27:23.000Z", "contentLength": 1226, "httpStatusCode": 200}	43251055-a7a1-43e4-80ef-0e68fb13f8c6	\N	{}
90623e63-2613-44b4-a24d-358ab02b7d45	icons	1769146044447-mechanical-devices-2.svg	\N	2026-01-23 05:27:24.650305+00	2026-01-23 05:27:24.650305+00	2026-01-23 05:27:24.650305+00	{"eTag": "\\"0c702d0dfda620febb5969d91b626da7\\"", "size": 974, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:27:25.000Z", "contentLength": 974, "httpStatusCode": 200}	b4d2456d-a17b-450d-bac3-25715691064e	\N	{}
5ac22404-9b54-4c05-9193-596ebf433084	icons	1770768378990-plane2.svg	\N	2026-02-11 00:06:19.093935+00	2026-02-11 00:06:19.093935+00	2026-02-11 00:06:19.093935+00	{"eTag": "\\"53e8c2b38e115e8847f15b0a31453e4b\\"", "size": 860, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:20.000Z", "contentLength": 860, "httpStatusCode": 200}	1c1379f0-1cb7-4402-9164-a1f2f9c9fd00	\N	{}
d4ab3b04-39f1-48e3-a234-8f82eae60d00	icons	1769146046812-medical-certificate.svg	\N	2026-01-23 05:27:26.991775+00	2026-01-23 05:27:26.991775+00	2026-01-23 05:27:26.991775+00	{"eTag": "\\"273542d58625ccbf8423f5fc411b3ffc\\"", "size": 1069, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:27:27.000Z", "contentLength": 1069, "httpStatusCode": 200}	b9eaa8e0-840f-48fa-91d4-a5b1cc1812ed	\N	{}
7df4f935-8bb1-4dee-964d-200c453bf8ee	icons	1769146049145-medical-records.svg	\N	2026-01-23 05:27:29.330153+00	2026-01-23 05:27:29.330153+00	2026-01-23 05:27:29.330153+00	{"eTag": "\\"d0552832e37e1a8b1ecc848127d98338\\"", "size": 1105, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:27:30.000Z", "contentLength": 1105, "httpStatusCode": 200}	2a12cfec-21b2-4f8a-b59f-10fd03e398ba	\N	{}
63083c6a-e36a-46fe-996e-0791b69165b6	icons	1769149298674-refresh.svg	\N	2026-01-23 06:21:39.402759+00	2026-01-23 06:21:39.402759+00	2026-01-23 06:21:39.402759+00	{"eTag": "\\"977d0127d9266741e370e9d2d7583f88\\"", "size": 718, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:21:40.000Z", "contentLength": 718, "httpStatusCode": 200}	6095cb65-6525-451b-8c4a-c596baf4e6ae	\N	{}
91053da2-00cf-4d87-98a4-8c318e8e84bb	icons	1770768379157-street-lamp.svg	\N	2026-02-11 00:06:19.241234+00	2026-02-11 00:06:19.241234+00	2026-02-11 00:06:19.241234+00	{"eTag": "\\"53e236884a30c22b6e991e8cf08e2c70\\"", "size": 666, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:20.000Z", "contentLength": 666, "httpStatusCode": 200}	55a51d66-18c6-49c7-ad01-f8a2fd4fa592	\N	{}
2b44b97a-ab60-4781-97ce-be27883bd575	icons	1769149301761-settings.svg	\N	2026-01-23 06:21:41.953282+00	2026-01-23 06:21:41.953282+00	2026-01-23 06:21:41.953282+00	{"eTag": "\\"b5e2308a7b50f1892c3a4d929386e1f0\\"", "size": 1675, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:21:42.000Z", "contentLength": 1675, "httpStatusCode": 200}	10919c6c-ca81-4a2b-8051-99613e18edee	\N	{}
a4d3d543-e185-472d-a580-8979c8152cbc	icons	1769149304036-warnings.svg	\N	2026-01-23 06:21:44.63158+00	2026-01-23 06:21:44.63158+00	2026-01-23 06:21:44.63158+00	{"eTag": "\\"88833a8611becf8da3e3bc4cbaaf32b0\\"", "size": 672, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:21:45.000Z", "contentLength": 672, "httpStatusCode": 200}	88277921-8346-47d4-9849-9ea5e3060bc4	\N	{}
9934cfbd-6a6a-4b80-a3ef-913d6695c9b0	icons	1769409037600-charging.svg	\N	2026-01-26 06:30:37.767444+00	2026-01-26 06:30:37.767444+00	2026-01-26 06:30:37.767444+00	{"eTag": "\\"d99dc8347f98d9a8a38fe513c5c65b07\\"", "size": 693, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:30:38.000Z", "contentLength": 693, "httpStatusCode": 200}	138447cc-d4f7-4c7c-8a79-6f79f4bda7e9	\N	{}
5d0017d5-7115-4d73-bd7d-54ca733754a1	icons	1769146312684-power-plant.svg	\N	2026-01-23 05:31:52.967154+00	2026-01-23 05:31:52.967154+00	2026-01-23 05:31:52.967154+00	{"eTag": "\\"d372229892bcf67a12abc2de313425a8\\"", "size": 909, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:31:53.000Z", "contentLength": 909, "httpStatusCode": 200}	dd4ed24d-5a03-4624-a387-fb0bd2560fe1	\N	{}
95dce034-5d47-4403-9fad-13f472a5cb68	icons	1769122153099-atm.svg	\N	2026-01-22 22:49:13.190449+00	2026-01-22 22:49:13.190449+00	2026-01-22 22:49:13.190449+00	{"eTag": "\\"0530678e7d029580a954aa4caee3170f\\"", "size": 895, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:49:14.000Z", "contentLength": 895, "httpStatusCode": 200}	249f958f-6ac1-44f0-b298-601c616aab6d	\N	{}
6b6b488d-3dec-4f78-8ec4-b076decb6e05	icons	1769122366897-bitcoin.svg	\N	2026-01-22 22:52:47.028053+00	2026-01-22 22:52:47.028053+00	2026-01-22 22:52:47.028053+00	{"eTag": "\\"a473ee0aed9c81cff166d894eb6acfe2\\"", "size": 832, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:52:47.000Z", "contentLength": 832, "httpStatusCode": 200}	94be3100-540c-4e02-8ad2-31a3e2d02034	\N	{}
c988d226-f131-4de7-a489-16a2357bf566	icons	1769146315230-sensor.svg	\N	2026-01-23 05:31:55.413385+00	2026-01-23 05:31:55.413385+00	2026-01-23 05:31:55.413385+00	{"eTag": "\\"dd43a8f78aaef18b7174ff9a5737ef9f\\"", "size": 817, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:31:56.000Z", "contentLength": 817, "httpStatusCode": 200}	fe7aad1a-0f1d-406b-bfe2-529df29535be	\N	{}
caed7b2f-119b-4813-a873-6e34222468bb	icons	1769122367154-calculator.svg	\N	2026-01-22 22:52:47.24533+00	2026-01-22 22:52:47.24533+00	2026-01-22 22:52:47.24533+00	{"eTag": "\\"7714ad1faa99f341d87bebefe02c8d0b\\"", "size": 1201, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:52:48.000Z", "contentLength": 1201, "httpStatusCode": 200}	b3fec664-4049-4efa-a719-6a3dc21b977b	\N	{}
4a9163c9-8fb2-403c-bc52-c576bdcef1e7	icons	1770701885773-main-frame.svg	\N	2026-02-10 05:38:05.92103+00	2026-02-10 05:38:05.92103+00	2026-02-10 05:38:05.92103+00	{"eTag": "\\"aaf9e100f9963c70346312d28f73302e\\"", "size": 867, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:06.000Z", "contentLength": 867, "httpStatusCode": 200}	b4569e6a-a269-45db-b71c-33e45dea18f5	\N	{}
1582571a-4531-4866-9166-f4be17fc7e1b	icons	1769122367370-card.svg	\N	2026-01-22 22:52:47.438633+00	2026-01-22 22:52:47.438633+00	2026-01-22 22:52:47.438633+00	{"eTag": "\\"303b26ae124652765fd395fa9c71de82\\"", "size": 777, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:52:48.000Z", "contentLength": 777, "httpStatusCode": 200}	600d2572-7b3b-4ba9-aa64-d20ca4c17125	\N	{}
f7d75c38-7e4a-447a-bda9-91bd17a9468c	icons	1769146317488-smart-medical-treatment.svg	\N	2026-01-23 05:31:58.070944+00	2026-01-23 05:31:58.070944+00	2026-01-23 05:31:58.070944+00	{"eTag": "\\"7bd1ae5d2cb34b5c631ddf01a2448b64\\"", "size": 943, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:31:59.000Z", "contentLength": 943, "httpStatusCode": 200}	4c2e0054-49ff-43c6-8967-ceeea1825f05	\N	{}
9b79a969-1f01-4904-9384-2a8dd6920d9f	icons	1769122367556-cryptocurrency-wallet.svg	\N	2026-01-22 22:52:47.656465+00	2026-01-22 22:52:47.656465+00	2026-01-22 22:52:47.656465+00	{"eTag": "\\"7ddd72095e30b747faede17583e0180c\\"", "size": 1184, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:52:48.000Z", "contentLength": 1184, "httpStatusCode": 200}	d087b5b6-a19d-4772-a082-ffa4ace94dc7	\N	{}
138f32ad-5c62-4b9f-b323-0b6e6ababa3d	icons	1769122367767-dollar-note.svg	\N	2026-01-22 22:52:47.859762+00	2026-01-22 22:52:47.859762+00	2026-01-22 22:52:47.859762+00	{"eTag": "\\"a4d514ff98e78a853bd396a526670915\\"", "size": 1056, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:52:48.000Z", "contentLength": 1056, "httpStatusCode": 200}	5b2f0855-87c1-43f3-9d4e-3c63081d3be7	\N	{}
58607e07-4925-4767-94cd-98bc2648ed7a	icons	1769146320138-syringe.svg	\N	2026-01-23 05:32:00.340071+00	2026-01-23 05:32:00.340071+00	2026-01-23 05:32:00.340071+00	{"eTag": "\\"cf5d67ac20642a22569e973e42728940\\"", "size": 995, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:32:01.000Z", "contentLength": 995, "httpStatusCode": 200}	10ceea7e-8fdc-4216-a7a5-0013c2945739	\N	{}
2ba9696d-29dc-491a-a707-2e899c9c6506	icons	1769122367979-dollar.svg	\N	2026-01-22 22:52:48.035675+00	2026-01-22 22:52:48.035675+00	2026-01-22 22:52:48.035675+00	{"eTag": "\\"64196a3d8c5e8052a7f9bdf235ff8e6c\\"", "size": 746, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:52:48.000Z", "contentLength": 746, "httpStatusCode": 200}	cd3fbc0e-131e-4e88-9dbd-d58c27e850dc	\N	{}
5e432da4-8add-4faf-8b40-02e29a0d46dc	icons	1769122368162-ethereum.svg	\N	2026-01-22 22:52:48.212378+00	2026-01-22 22:52:48.212378+00	2026-01-22 22:52:48.212378+00	{"eTag": "\\"b6a527b6254bb57af4f10eea796106b7\\"", "size": 595, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:52:49.000Z", "contentLength": 595, "httpStatusCode": 200}	b42be728-aa50-4c9e-bbca-0ece5c56b2c5	\N	{}
58bf9987-96d2-4694-9c90-15963401248e	icons	1769122368326-graph.svg	\N	2026-01-22 22:52:48.392018+00	2026-01-22 22:52:48.392018+00	2026-01-22 22:52:48.392018+00	{"eTag": "\\"5b4e83be9156c6a4eee223d7fb2af0b8\\"", "size": 638, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:52:49.000Z", "contentLength": 638, "httpStatusCode": 200}	ecf10b65-bc24-428c-baa1-4de7354bb39f	\N	{}
b9e9aeef-a237-4141-aac7-2f565130a786	icons	1769122459822-wallet.svg	\N	2026-01-22 22:54:20.182036+00	2026-01-22 22:54:20.182036+00	2026-01-22 22:54:20.182036+00	{"eTag": "\\"4a9d7f26ef2ec8cd25d3e1c861074bb3\\"", "size": 797, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:54:21.000Z", "contentLength": 797, "httpStatusCode": 200}	fd9fedf9-68a2-44f5-a8e9-2901837ff2ba	\N	{}
7dc52584-bb90-4b40-b65b-aa157966e91b	icons	1769122460313-won-note.svg	\N	2026-01-22 22:54:20.388543+00	2026-01-22 22:54:20.388543+00	2026-01-22 22:54:20.388543+00	{"eTag": "\\"20b9cd2960b4b258f8a6308a5333fa5a\\"", "size": 1003, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:54:21.000Z", "contentLength": 1003, "httpStatusCode": 200}	60d7fc61-e6f3-49e0-9b19-7db6a07ad0a6	\N	{}
d561623a-5868-4b88-9617-c6056f700819	icons	1769122460494-won.svg	\N	2026-01-22 22:54:20.562894+00	2026-01-22 22:54:20.562894+00	2026-01-22 22:54:20.562894+00	{"eTag": "\\"cf1f76803498425c41c095aa88af088f\\"", "size": 682, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:54:21.000Z", "contentLength": 682, "httpStatusCode": 200}	abc08c06-c2ae-40f1-ac24-ec3721d16a20	\N	{}
c0147f73-b02f-4cf2-bed8-e912532e579f	icons	1770698297844-apple.svg	\N	2026-02-10 04:38:18.421988+00	2026-02-10 04:38:18.421988+00	2026-02-10 04:38:18.421988+00	{"eTag": "\\"b95996fa87892fc8c7f4ed6a71f1c59a\\"", "size": 1182, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:38:19.000Z", "contentLength": 1182, "httpStatusCode": 200}	db38ec6a-1255-4056-8592-ed334024d0d9	\N	{}
c137ed42-f24e-4f2b-ac31-df6ce85d2e19	icons	1769122460668-yen-note.svg	\N	2026-01-22 22:54:20.778141+00	2026-01-22 22:54:20.778141+00	2026-01-22 22:54:20.778141+00	{"eTag": "\\"6d3296809ad22161428ee7963138a26a\\"", "size": 1028, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:54:21.000Z", "contentLength": 1028, "httpStatusCode": 200}	5eee2623-3284-40f2-8478-ea964cfd3df4	\N	{}
1360cebf-d656-4e2a-af49-dfb8e4d3569c	icons	1769146322421-x-ray.svg	\N	2026-01-23 05:32:02.620811+00	2026-01-23 05:32:02.620811+00	2026-01-23 05:32:02.620811+00	{"eTag": "\\"ac24776fb2dfb846c47a209207d138ad\\"", "size": 939, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:32:03.000Z", "contentLength": 939, "httpStatusCode": 200}	e55eff89-9a60-4eb3-95be-a3efa1cf55da	\N	{}
62bebf2b-4030-438b-8771-2e4ae7fce3af	icons	1769122460886-yen.svg	\N	2026-01-22 22:54:20.942937+00	2026-01-22 22:54:20.942937+00	2026-01-22 22:54:20.942937+00	{"eTag": "\\"dd2611efe1ea878fca0158918a4441d4\\"", "size": 703, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:54:21.000Z", "contentLength": 703, "httpStatusCode": 200}	3b82df95-a039-416c-b6c9-87f399ca2e58	\N	{}
962b3082-9658-4177-8846-781976a0554a	icons	1770771982873-train1.svg	\N	2026-02-11 01:06:23.165687+00	2026-02-11 01:06:23.165687+00	2026-02-11 01:06:23.165687+00	{"eTag": "\\"8825f1414bd0a9b0f9e2601bedc1ed81\\"", "size": 776, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:06:24.000Z", "contentLength": 776, "httpStatusCode": 200}	5a3bf6f2-6404-4778-808a-64a1c9df5e70	\N	{}
58235ee9-8d0a-4d8c-93d8-99457e215f42	icons	1769122461052-yuan-note.svg	\N	2026-01-22 22:54:21.133607+00	2026-01-22 22:54:21.133607+00	2026-01-22 22:54:21.133607+00	{"eTag": "\\"24fafaa9232875342c03b76f97d970f0\\"", "size": 1096, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:54:22.000Z", "contentLength": 1096, "httpStatusCode": 200}	3cc1caff-d914-40cd-80d8-1e9fc2fec9dd	\N	{}
c6d7f6e5-b543-48f5-8d52-9963d87b8adb	icons	1769122461246-yuan.svg	\N	2026-01-22 22:54:21.31136+00	2026-01-22 22:54:21.31136+00	2026-01-22 22:54:21.31136+00	{"eTag": "\\"0841323d7064e7d0b22aca40925746a5\\"", "size": 774, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-22T22:54:22.000Z", "contentLength": 774, "httpStatusCode": 200}	a0d82802-0eab-4ed2-8a2b-4663240b934d	\N	{}
df6d9097-7311-497c-9a53-e63af329a539	icons	1769407844603-flag.svg	\N	2026-01-26 06:10:45.057495+00	2026-01-26 06:10:45.057495+00	2026-01-26 06:10:45.057495+00	{"eTag": "\\"2def8e770b0042dbbd52169f7f74edd8\\"", "size": 543, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:10:46.000Z", "contentLength": 543, "httpStatusCode": 200}	bd95987a-4100-40fe-af15-ea47fbb91e01	\N	{}
a5ae963a-62ff-4478-a202-5350b14cea93	icons	1770701912841-secure-gateway.svg	\N	2026-02-10 05:38:32.95376+00	2026-02-10 05:38:32.95376+00	2026-02-10 05:38:32.95376+00	{"eTag": "\\"39d43e75e28c98184ce4c7f42d10fdeb\\"", "size": 1322, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:33.000Z", "contentLength": 1322, "httpStatusCode": 200}	34b79bdb-d89d-4973-b685-4a4dc8bf714a	\N	{}
ccdbbe65-2ecd-4ef0-a312-8a4d12bb5571	icons	1769408286097-bookmark.svg	\N	2026-01-26 06:18:06.354215+00	2026-01-26 06:18:06.354215+00	2026-01-26 06:18:06.354215+00	{"eTag": "\\"3bb9ebcb6fef97196df9ee3ec552f3ad\\"", "size": 940, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:18:07.000Z", "contentLength": 940, "httpStatusCode": 200}	9cae67b0-542b-4880-b988-340da2b0f4f9	\N	{}
7ff760a9-941e-40ad-a00d-7d280067bab5	icons	1769408377582-search.svg	\N	2026-01-26 06:19:37.999572+00	2026-01-26 06:19:37.999572+00	2026-01-26 06:19:37.999572+00	{"eTag": "\\"e3d94d338eb2e4bb45a82b5d98fc2d98\\"", "size": 668, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:19:38.000Z", "contentLength": 668, "httpStatusCode": 200}	3ee0a319-aa83-43f3-b7cc-ba35928d6b89	\N	{}
2a4b567c-7849-490c-b018-abcb05da6ac3	icons	1769408522356-view.svg	\N	2026-01-26 06:22:02.804783+00	2026-01-26 06:22:02.804783+00	2026-01-26 06:22:02.804783+00	{"eTag": "\\"e1826eb361869edcdfee0356966b2660\\"", "size": 637, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:22:03.000Z", "contentLength": 637, "httpStatusCode": 200}	1359d409-cbad-4ffb-a6f0-f92661924c22	\N	{}
36b2a1ea-3250-45b3-8f4b-6f187d332ca3	icons	1770701913004-server-agent.svg	\N	2026-02-10 05:38:33.093762+00	2026-02-10 05:38:33.093762+00	2026-02-10 05:38:33.093762+00	{"eTag": "\\"f1cf4b48f66bd274b9901cc0241af3e1\\"", "size": 1600, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:34.000Z", "contentLength": 1600, "httpStatusCode": 200}	3b2251ab-7f07-4e7d-aa75-9f2074d2d938	\N	{}
365c8a04-f388-4321-84e4-d44b94a33fee	icons	1769409036627-battery-discharge.svg	\N	2026-01-26 06:30:37.292248+00	2026-01-26 06:30:37.292248+00	2026-01-26 06:30:37.292248+00	{"eTag": "\\"a588c29a74fe73a30a45df94c9dedc11\\"", "size": 716, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:30:38.000Z", "contentLength": 716, "httpStatusCode": 200}	892511dc-8419-4d9a-8975-83c769fbc0fa	\N	{}
cf042f6a-8c32-4852-8f52-649acdd8cb8f	icons	1769409037376-battery.svg	\N	2026-01-26 06:30:37.541603+00	2026-01-26 06:30:37.541603+00	2026-01-26 06:30:37.541603+00	{"eTag": "\\"6f6fd53534538e8ddc6a8b4a0c057e4d\\"", "size": 594, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:30:38.000Z", "contentLength": 594, "httpStatusCode": 200}	9e5a109e-07b0-44b3-b4b3-3661d345f9f8	\N	{}
0f328fca-3f05-4cf9-ab05-ddb5c5c24a45	icons	1769143613431-home.svg	\N	2026-01-23 04:46:54.071985+00	2026-01-23 04:46:54.071985+00	2026-01-23 04:46:54.071985+00	{"eTag": "\\"1ca4cc90460bb76c4a9b8528cc39f1c0\\"", "size": 546, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T04:46:55.000Z", "contentLength": 546, "httpStatusCode": 200}	d2e8b282-268d-4955-b51d-2940d33e123d	\N	{}
8e20ef5f-b8fa-4684-8094-0712f4624125	icons	1770771983282-train2.svg	\N	2026-02-11 01:06:23.39289+00	2026-02-11 01:06:23.39289+00	2026-02-11 01:06:23.39289+00	{"eTag": "\\"88bbcfd3cebca8b1040d1aa83e888840\\"", "size": 714, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:06:24.000Z", "contentLength": 714, "httpStatusCode": 200}	caa664be-2825-4b80-84d7-e071479b03fc	\N	{}
b3a6c4f0-eaaf-4bdc-a0f9-920a0a13173f	icons	1769143678122-vr.svg	\N	2026-01-23 04:47:58.722718+00	2026-01-23 04:47:58.722718+00	2026-01-23 04:47:58.722718+00	{"eTag": "\\"0c97b66b25baf72049c90e4de3b9dc2d\\"", "size": 778, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T04:47:59.000Z", "contentLength": 778, "httpStatusCode": 200}	8029392e-07ce-45ea-8ea3-b4b7b716ec49	\N	{}
e503d03b-0424-4820-aa22-1dea9e65be57	icons	1769148047082-company-gate.svg	\N	2026-01-23 06:00:47.60465+00	2026-01-23 06:00:47.60465+00	2026-01-23 06:00:47.60465+00	{"eTag": "\\"67c6cad3d5abc6d47dce46cc466a46c2\\"", "size": 714, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:00:48.000Z", "contentLength": 714, "httpStatusCode": 200}	d07a0f29-dca0-40cd-a7e3-17ff6fe3940b	\N	{}
cdced66f-2354-46f8-8378-caac2831298f	icons	1769143933188-refrigerator.svg	\N	2026-01-23 04:52:13.498535+00	2026-01-23 04:52:13.498535+00	2026-01-23 04:52:13.498535+00	{"eTag": "\\"c0b0012da627c078c8c336ff96be2c92\\"", "size": 628, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T04:52:14.000Z", "contentLength": 628, "httpStatusCode": 200}	8799eb15-aafa-4088-b0dd-31e4a236aa87	\N	{}
a4f21c72-f2dc-4227-9ac1-661386e4236c	icons	1769143935911-tv.svg	\N	2026-01-23 04:52:16.544361+00	2026-01-23 04:52:16.544361+00	2026-01-23 04:52:16.544361+00	{"eTag": "\\"99d07f24b4651e9c6dbe71988b5f4551\\"", "size": 899, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T04:52:17.000Z", "contentLength": 899, "httpStatusCode": 200}	0255e783-f0df-40a6-867a-fb78e06531e5	\N	{}
3d3c72be-488f-4d53-8285-436bb4ca64ee	icons	1769148049966-fingerprint-recognition.svg	\N	2026-01-23 06:00:50.141287+00	2026-01-23 06:00:50.141287+00	2026-01-23 06:00:50.141287+00	{"eTag": "\\"5f3a98b9208e19188210106395216d21\\"", "size": 1192, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:00:51.000Z", "contentLength": 1192, "httpStatusCode": 200}	b5431063-0265-48e9-bcd9-04a5230112ad	\N	{}
d30690bc-864b-43ab-bc19-85c82d142b08	icons	1769144188449-game-console.svg	\N	2026-01-23 04:56:28.946602+00	2026-01-23 04:56:28.946602+00	2026-01-23 04:56:28.946602+00	{"eTag": "\\"e615bf840a304b4b89c92c59f7e5de9e\\"", "size": 1045, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T04:56:29.000Z", "contentLength": 1045, "httpStatusCode": 200}	b48e640c-7825-413c-bb6d-b1352cdaeb72	\N	{}
753afb38-25ec-4d41-b1fd-07d4ed7e7e21	icons	1770701806142-attack.svg	\N	2026-02-10 05:36:46.448838+00	2026-02-10 05:36:46.448838+00	2026-02-10 05:36:46.448838+00	{"eTag": "\\"ba670ca8252916664c64fd3248491399\\"", "size": 651, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:36:47.000Z", "contentLength": 651, "httpStatusCode": 200}	ce934868-29d9-4485-a739-fad9fff6cad4	\N	{}
6a1a2ea8-ea82-4657-8778-70cafe63ede5	icons	1769144191422-washer.svg	\N	2026-01-23 04:56:32.03998+00	2026-01-23 04:56:32.03998+00	2026-01-23 04:56:32.03998+00	{"eTag": "\\"aebf417128e4045f599a51b6dd01a2f9\\"", "size": 763, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T04:56:33.000Z", "contentLength": 763, "httpStatusCode": 200}	382e14ab-6c5f-401a-84c5-8aea8fc3dc26	\N	{}
64774a44-3a9d-40bb-a22d-72c9f068f053	icons	1769148052302-machine-learning-1.svg	\N	2026-01-23 06:00:52.906616+00	2026-01-23 06:00:52.906616+00	2026-01-23 06:00:52.906616+00	{"eTag": "\\"9785769521961407f7f443dfc0f13d47\\"", "size": 2894, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:00:53.000Z", "contentLength": 2894, "httpStatusCode": 200}	bea51744-a9b5-4946-915e-ab53f03a3d94	\N	{}
32678018-af08-4c7c-af6b-adc89fcf91f9	icons	1769148055058-machine-learning-2.svg	\N	2026-01-23 06:00:55.628853+00	2026-01-23 06:00:55.628853+00	2026-01-23 06:00:55.628853+00	{"eTag": "\\"be35e94c51ffea1ca77fe5770faa8549\\"", "size": 5440, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:00:56.000Z", "contentLength": 5440, "httpStatusCode": 200}	c709efe2-59bb-42b2-96c0-70de7230b4b4	\N	{}
bce60611-f5a9-4932-9aad-d6c12d0e5620	icons	1769148057783-password.svg	\N	2026-01-23 06:00:57.947405+00	2026-01-23 06:00:57.947405+00	2026-01-23 06:00:57.947405+00	{"eTag": "\\"b6c3debce28bac2d7ab482dc0e8da535\\"", "size": 1702, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:00:58.000Z", "contentLength": 1702, "httpStatusCode": 200}	50894815-5e0a-4688-a1b8-6e0ada34f19a	\N	{}
e41f6563-31c4-43ac-a517-aa411f0f1687	icons	1770701806546-backbone-switch.svg	\N	2026-02-10 05:36:46.647228+00	2026-02-10 05:36:46.647228+00	2026-02-10 05:36:46.647228+00	{"eTag": "\\"ed6e506e6d8947481e0c1e33597da2c4\\"", "size": 1394, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:36:47.000Z", "contentLength": 1394, "httpStatusCode": 200}	d06ee9b2-9335-442d-b864-4f6fdf669bd4	\N	{}
fd2ece97-6e77-490a-b609-62b2699fffe1	icons	1769148060099-smart-city.svg	\N	2026-01-23 06:01:00.358758+00	2026-01-23 06:01:00.358758+00	2026-01-23 06:01:00.358758+00	{"eTag": "\\"b235e6bddc803c6a4034f47ccb4eabbe\\"", "size": 2167, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:01:01.000Z", "contentLength": 2167, "httpStatusCode": 200}	a4585e13-7629-4317-ae77-8d85a5da701b	\N	{}
036a4067-d9c7-4d65-a4ea-eeb45760f5d0	icons	1769408068848-delete.svg	\N	2026-01-26 06:14:29.48214+00	2026-01-26 06:14:29.48214+00	2026-01-26 06:14:29.48214+00	{"eTag": "\\"111fbd3f6d92c76947dce23a0686a508\\"", "size": 732, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:14:30.000Z", "contentLength": 732, "httpStatusCode": 200}	7519e59d-26d4-4f18-9ef4-d2770e33d1cd	\N	{}
e69c939d-8c45-431e-a9db-df591eafb2bd	icons	1769408196345-calendar.svg	\N	2026-01-26 06:16:37.061137+00	2026-01-26 06:16:37.061137+00	2026-01-26 06:16:37.061137+00	{"eTag": "\\"ddf9365c62dd11b74cc180c8236c1451\\"", "size": 1246, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:16:37.000Z", "contentLength": 1246, "httpStatusCode": 200}	e61c2f2f-aab5-4633-b2f6-15d09916199a	\N	{}
b4080217-626c-4239-ad97-a6a53ae51867	icons	1769145892889-cctv.svg	\N	2026-01-23 05:24:53.756719+00	2026-01-23 05:24:53.756719+00	2026-01-23 05:24:53.756719+00	{"eTag": "\\"362883a76cd65cf63c01e630394b038b\\"", "size": 1014, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:24:54.000Z", "contentLength": 1014, "httpStatusCode": 200}	02c76710-bfb6-4649-a2e9-ddb6dd758ef2	\N	{}
3e8864d7-9c04-4c01-9bb2-430832d24eb0	icons	1770701806690-block-chain.svg	\N	2026-02-10 05:36:46.794049+00	2026-02-10 05:36:46.794049+00	2026-02-10 05:36:46.794049+00	{"eTag": "\\"5f1eff1cb09b1b3cf5b99b8f7652f2a1\\"", "size": 2131, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:36:47.000Z", "contentLength": 2131, "httpStatusCode": 200}	022e1ece-176f-4490-9dd1-3b36e25715cd	\N	{}
8dcd36c1-dc16-440a-a4a8-d4a49105739d	icons	1769145895971-consent-form.svg	\N	2026-01-23 05:24:56.164483+00	2026-01-23 05:24:56.164483+00	2026-01-23 05:24:56.164483+00	{"eTag": "\\"88ba5019cb4c4972a335b1e6733d4c1f\\"", "size": 781, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:24:57.000Z", "contentLength": 781, "httpStatusCode": 200}	ee37e4c3-e158-40e2-8777-da3a5b3dc801	\N	{}
9737cc18-be75-475e-b207-e9fd1b445e65	icons	1769149244440-add.svg	\N	2026-01-23 06:20:45.215654+00	2026-01-23 06:20:45.215654+00	2026-01-23 06:20:45.215654+00	{"eTag": "\\"365e655e5d4ba8862041aee713e9f88a\\"", "size": 479, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:20:46.000Z", "contentLength": 479, "httpStatusCode": 200}	318ad984-76ef-41d0-b0c6-477401282750	\N	{}
14396c3d-efb1-4373-acc0-9f5f7292a5c7	icons	1769145898333-doctor.svg	\N	2026-01-23 05:24:58.502806+00	2026-01-23 05:24:58.502806+00	2026-01-23 05:24:58.502806+00	{"eTag": "\\"366d7719f4f7b4e37d0e375d3e8df240\\"", "size": 899, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:24:59.000Z", "contentLength": 899, "httpStatusCode": 200}	b2eea08b-3028-4c5a-a665-63b3c4d480ab	\N	{}
45ea4e1e-9087-45ef-ab47-d05578cacf38	icons	1770697613921-admin.svg	\N	2026-02-10 04:26:54.522234+00	2026-02-10 04:26:54.522234+00	2026-02-10 04:26:54.522234+00	{"eTag": "\\"bd21ae52d05741b59642a100b8497955\\"", "size": 760, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:26:55.000Z", "contentLength": 760, "httpStatusCode": 200}	2df81afd-d31f-42d2-8df1-489024cd347a	\N	{}
91b8d44a-1c4c-4b58-8b49-a6a6beaba2e2	icons	1769145900658-drone-1.svg	\N	2026-01-23 05:25:00.843161+00	2026-01-23 05:25:00.843161+00	2026-01-23 05:25:00.843161+00	{"eTag": "\\"8c7c2d726117bbda0fc43f0ef3f89d67\\"", "size": 1292, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:25:01.000Z", "contentLength": 1292, "httpStatusCode": 200}	7d0e09a5-8613-4a5e-bfae-b6567540e372	\N	{}
df4a7d83-0baf-4c41-8c95-d2566003f37c	icons	1769149248865-arrow-left.svg	\N	2026-01-23 06:20:49.481188+00	2026-01-23 06:20:49.481188+00	2026-01-23 06:20:49.481188+00	{"eTag": "\\"84b2389c2345588dc130138625590479\\"", "size": 464, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:20:50.000Z", "contentLength": 464, "httpStatusCode": 200}	b7bf7326-07cc-4011-b44a-b0d52b2ffe37	\N	{}
fa2f7bad-420b-4034-b52e-14c1d0fb0c7e	icons	1769145903042-drone-2.svg	\N	2026-01-23 05:25:03.216138+00	2026-01-23 05:25:03.216138+00	2026-01-23 05:25:03.216138+00	{"eTag": "\\"1fc0c4ab29454e3f62398b12077ae406\\"", "size": 1377, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T05:25:04.000Z", "contentLength": 1377, "httpStatusCode": 200}	2d8d06ed-669c-434c-89a5-5dd943fa770e	\N	{}
3a9beccf-a45b-447d-a787-2418be863588	icons	1769149251592-arrow-right.svg	\N	2026-01-23 06:20:51.78671+00	2026-01-23 06:20:51.78671+00	2026-01-23 06:20:51.78671+00	{"eTag": "\\"0365622c41acf0b9114732aba4db27a2\\"", "size": 463, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:20:52.000Z", "contentLength": 463, "httpStatusCode": 200}	6a025302-30ff-4496-9b8d-0fe1e37b71a7	\N	{}
f9e84d73-5515-4460-9ed4-2f6cf23365a5	icons	1770697614661-android.svg	\N	2026-02-10 04:26:54.755614+00	2026-02-10 04:26:54.755614+00	2026-02-10 04:26:54.755614+00	{"eTag": "\\"29613eaeb69f3698b203aba3ae2a23e6\\"", "size": 1689, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:26:55.000Z", "contentLength": 1689, "httpStatusCode": 200}	b94b0cce-2a4e-44fd-920d-ca47c496cad5	\N	{}
16c6a7ae-831e-4bba-b16c-9638c649986f	icons	1769149253904-check.svg	\N	2026-01-23 06:20:54.077457+00	2026-01-23 06:20:54.077457+00	2026-01-23 06:20:54.077457+00	{"eTag": "\\"37ed53d0185b476f30b6d6da9a83a538\\"", "size": 607, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:20:55.000Z", "contentLength": 607, "httpStatusCode": 200}	a0ae31f0-0708-4ec7-b687-25a6f5f05260	\N	{}
cd3699ee-dfc0-4f28-9250-a0b65b57f1b3	icons	1769149256183-close.svg	\N	2026-01-23 06:20:56.354138+00	2026-01-23 06:20:56.354138+00	2026-01-23 06:20:56.354138+00	{"eTag": "\\"15c5792363c3630df97d4b7d1b4251e1\\"", "size": 485, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:20:57.000Z", "contentLength": 485, "httpStatusCode": 200}	7b920564-76e4-4700-903f-0a27791c93c7	\N	{}
27a46fae-27cd-485a-8390-b4fee717e978	icons	1769149275219-help.svg	\N	2026-01-23 06:21:15.857654+00	2026-01-23 06:21:15.857654+00	2026-01-23 06:21:15.857654+00	{"eTag": "\\"4e425e0d069a0df87018f2e17f4af67c\\"", "size": 837, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:21:16.000Z", "contentLength": 837, "httpStatusCode": 200}	3758fc88-66c9-44f4-92f2-19db93fdc5d4	\N	{}
e9873c99-3c33-4443-b671-b5c97002e95a	icons	1769149279105-image.svg	\N	2026-01-23 06:21:19.310096+00	2026-01-23 06:21:19.310096+00	2026-01-23 06:21:19.310096+00	{"eTag": "\\"ebd3e0cfc419bb89b100fa667413cb45\\"", "size": 624, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:21:20.000Z", "contentLength": 624, "httpStatusCode": 200}	34ac8e0f-4bf1-48a3-b1dd-b24038d131a9	\N	{}
bfc4304f-d2fd-43a3-831d-85a29dbb7965	icons	1769149281411-list-1.svg	\N	2026-01-23 06:21:21.592944+00	2026-01-23 06:21:21.592944+00	2026-01-23 06:21:21.592944+00	{"eTag": "\\"d23a5492a3b66950dcfee174f85a2db6\\"", "size": 933, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:21:22.000Z", "contentLength": 933, "httpStatusCode": 200}	cc47e4be-7a5a-4fdc-b22e-77b62ebb0019	\N	{}
4c72cede-4324-4af3-b5b9-e818f8ff05ae	icons	1769149283680-list-2.svg	\N	2026-01-23 06:21:23.908936+00	2026-01-23 06:21:23.908936+00	2026-01-23 06:21:23.908936+00	{"eTag": "\\"459df675771012cad0a6dc87cf4e70d5\\"", "size": 580, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T06:21:24.000Z", "contentLength": 580, "httpStatusCode": 200}	8861906f-34bc-4e81-a12e-e29d02b95df8	\N	{}
4291aa0c-07d6-4b5a-ac1b-37937be36ff3	icons	1769409037811-control-settings.svg	\N	2026-01-26 06:30:37.956674+00	2026-01-26 06:30:37.956674+00	2026-01-26 06:30:37.956674+00	{"eTag": "\\"718ee9b172c75ffd19a310ee049fa82a\\"", "size": 829, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:30:38.000Z", "contentLength": 829, "httpStatusCode": 200}	e7d8141f-7b8b-4383-8262-d8e288b4c3aa	\N	{}
c7549697-549a-4537-b0ae-ced29b1e365c	icons	1770771983451-truck-boxtop1.svg	\N	2026-02-11 01:06:23.558433+00	2026-02-11 01:06:23.558433+00	2026-02-11 01:06:23.558433+00	{"eTag": "\\"426ac548d13239edc69c69b379ac6d5f\\"", "size": 737, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:06:24.000Z", "contentLength": 737, "httpStatusCode": 200}	4d174ddb-0264-4fd1-b8e6-49c8f20c3136	\N	{}
54bbef18-3db2-4a56-a03a-1850e523917c	icons	1769409038007-hiding.svg	\N	2026-01-26 06:30:38.15414+00	2026-01-26 06:30:38.15414+00	2026-01-26 06:30:38.15414+00	{"eTag": "\\"674bf27ac7e10ca24ddad68b202ae727\\"", "size": 695, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:30:39.000Z", "contentLength": 695, "httpStatusCode": 200}	6a204e04-f1d9-4c1a-b642-f16b10bdf5a8	\N	{}
f551b8d7-9ae8-4745-8621-1e5c3e30b855	icons	1770697615063-bluetooth.svg	\N	2026-02-10 04:26:55.157277+00	2026-02-10 04:26:55.157277+00	2026-02-10 04:26:55.157277+00	{"eTag": "\\"2864d385f9c3f15dc5b12ec7ab79cc02\\"", "size": 807, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:26:56.000Z", "contentLength": 807, "httpStatusCode": 200}	3cbc2486-7cf8-4269-9986-bee4f72c53c7	\N	{}
4bb2df1d-de61-49e2-8d37-e15165d3bd7b	icons	1770768379300-subway.svg	\N	2026-02-11 00:06:19.377377+00	2026-02-11 00:06:19.377377+00	2026-02-11 00:06:19.377377+00	{"eTag": "\\"571a3db16ac3f793d7d765d19c13e645\\"", "size": 1131, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:20.000Z", "contentLength": 1131, "httpStatusCode": 200}	b1d9ac19-2ba1-4562-813f-4f067aa9fdf3	\N	{}
4d4ac9f5-543b-47ef-a42e-9e3ec6a3d94f	icons	1770768379442-tool1.svg	\N	2026-02-11 00:06:19.506231+00	2026-02-11 00:06:19.506231+00	2026-02-11 00:06:19.506231+00	{"eTag": "\\"738dbcf5a243d2d1a723be645fb7f9eb\\"", "size": 889, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:20.000Z", "contentLength": 889, "httpStatusCode": 200}	66cdd5d2-4579-46fa-a8e5-383fa02b8d75	\N	{}
7bcc2c21-9755-48e2-bb31-55a8791525cd	icons	1770768379562-tool2.svg	\N	2026-02-11 00:06:19.657582+00	2026-02-11 00:06:19.657582+00	2026-02-11 00:06:19.657582+00	{"eTag": "\\"97c4f3b20ec26b6b58c499e3ce581934\\"", "size": 789, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:20.000Z", "contentLength": 789, "httpStatusCode": 200}	14f5967d-d9c5-41b8-b7e9-2a992d0e6e03	\N	{}
55434e14-8153-46d9-82e6-c636ca9bb772	icons	1770768379723-tool3.svg	\N	2026-02-11 00:06:19.817179+00	2026-02-11 00:06:19.817179+00	2026-02-11 00:06:19.817179+00	{"eTag": "\\"8d81cab0025238fc1d84d7df72afba6d\\"", "size": 1268, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:20.000Z", "contentLength": 1268, "httpStatusCode": 200}	444b4eae-0356-4c50-95d4-0caf5360f871	\N	{}
d55d1107-e395-458e-be05-639bfa56c4af	icons	1770768379877-tractor.svg	\N	2026-02-11 00:06:19.942713+00	2026-02-11 00:06:19.942713+00	2026-02-11 00:06:19.942713+00	{"eTag": "\\"a1e1340b14f4d2554a07b74d798a95c1\\"", "size": 841, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:20.000Z", "contentLength": 841, "httpStatusCode": 200}	7887d5ff-6f8e-4465-bfff-9e6997cf3199	\N	{}
484f799b-a36f-47d3-8695-13a11bdb518a	icons	1770768380002-truck.svg	\N	2026-02-11 00:06:20.085925+00	2026-02-11 00:06:20.085925+00	2026-02-11 00:06:20.085925+00	{"eTag": "\\"45b569bd42a4d1ec16aead12595f6b4f\\"", "size": 852, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:21.000Z", "contentLength": 852, "httpStatusCode": 200}	52d4d48e-b2b9-4a48-9e7d-00de4763c6cc	\N	{}
4a544dac-e8a2-4bae-a88a-41822deab5bc	icons	1770768380150-usb.svg	\N	2026-02-11 00:06:20.218083+00	2026-02-11 00:06:20.218083+00	2026-02-11 00:06:20.218083+00	{"eTag": "\\"ce822698b7dc737b7db48e849b81e4b0\\"", "size": 1039, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:21.000Z", "contentLength": 1039, "httpStatusCode": 200}	c23d89c6-de33-4b70-99e5-4d3bc2ad8c56	\N	{}
94d9a6a1-f503-462b-b513-4491431ca4c9	icons	1770771809946-abs.svg	\N	2026-02-11 01:03:30.492209+00	2026-02-11 01:03:30.492209+00	2026-02-11 01:03:30.492209+00	{"eTag": "\\"4c7bf80b6bb7fe3b9f379fcb7eb17991\\"", "size": 1587, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:31.000Z", "contentLength": 1587, "httpStatusCode": 200}	c7f58eb7-ac73-4f7a-92c1-aa9c5c68a373	\N	{}
febc291b-d71f-44f4-a668-bf44b159a4e6	icons	1770771810607-airbag.svg	\N	2026-02-11 01:03:30.699357+00	2026-02-11 01:03:30.699357+00	2026-02-11 01:03:30.699357+00	{"eTag": "\\"b1531956073cd6c84ea3b964018c2345\\"", "size": 916, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:31.000Z", "contentLength": 916, "httpStatusCode": 200}	9da9996e-d08f-499f-9537-8ffaa3fa73b3	\N	{}
74c3d2ad-1e2e-464d-9de2-f56470cdcc40	icons	1770771810778-ambulance.svg	\N	2026-02-11 01:03:30.886407+00	2026-02-11 01:03:30.886407+00	2026-02-11 01:03:30.886407+00	{"eTag": "\\"9dc2808fbabe29e591bd92dd739f89b4\\"", "size": 972, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:31.000Z", "contentLength": 972, "httpStatusCode": 200}	52cdf59f-7ec2-4942-b85e-e5b8b784f764	\N	{}
54f199fc-7c2a-4708-8577-b6a06987349c	icons	1770771810952-battery-car.svg	\N	2026-02-11 01:03:31.04737+00	2026-02-11 01:03:31.04737+00	2026-02-11 01:03:31.04737+00	{"eTag": "\\"5c3dbe1f18d37b171cfc679d956c961f\\"", "size": 756, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:32.000Z", "contentLength": 756, "httpStatusCode": 200}	97a46bcb-a173-41c8-bd9e-9ef6826909d7	\N	{}
52eaa8bb-8d74-493f-a46c-d70be276e612	icons	1770771811107-break.svg	\N	2026-02-11 01:03:31.18779+00	2026-02-11 01:03:31.18779+00	2026-02-11 01:03:31.18779+00	{"eTag": "\\"9f5c8c0c0a48608ab132d054d71e0e05\\"", "size": 824, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:32.000Z", "contentLength": 824, "httpStatusCode": 200}	f863d411-9bc6-43d0-85a0-d72df94846ab	\N	{}
6f83a9ca-ab05-4b70-92bc-08e4eff5e93b	icons	1770771811244-bus-ev.svg	\N	2026-02-11 01:03:31.341889+00	2026-02-11 01:03:31.341889+00	2026-02-11 01:03:31.341889+00	{"eTag": "\\"ef1c7c6086ce24ffbfcf9a525af5036e\\"", "size": 979, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:32.000Z", "contentLength": 979, "httpStatusCode": 200}	f7729a22-9fb8-479d-b1b8-50a8ce5c73d8	\N	{}
aeb24c69-84e7-4761-8883-4c4372599316	icons	1769409709439-inquiry.svg	\N	2026-01-26 06:41:50.426077+00	2026-01-26 06:41:50.426077+00	2026-01-26 06:41:50.426077+00	{"eTag": "\\"9b2e7d098839981810dfd7bc36adc450\\"", "size": 669, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:41:51.000Z", "contentLength": 669, "httpStatusCode": 200}	d2185f26-70e6-4b73-a531-a440994caa8f	\N	{}
af9c4f22-5c72-47f2-a584-75a14fceaad1	icons	1770771983622-truck-boxtop2.svg	\N	2026-02-11 01:06:23.737258+00	2026-02-11 01:06:23.737258+00	2026-02-11 01:06:23.737258+00	{"eTag": "\\"83f0bb1d259e3bc50e73750c933fb321\\"", "size": 2008, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:06:24.000Z", "contentLength": 2008, "httpStatusCode": 200}	c3f13240-c2b5-46e7-b68a-2b1b6a613260	\N	{}
93f4e4c0-b39e-4e12-8343-49b677320d0f	icons	1769409710437-notification.svg	\N	2026-01-26 06:41:50.610346+00	2026-01-26 06:41:50.610346+00	2026-01-26 06:41:50.610346+00	{"eTag": "\\"09bb5db13f3e53fb2103403f599aa052\\"", "size": 771, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:41:51.000Z", "contentLength": 771, "httpStatusCode": 200}	d1c51f17-9e85-42a3-bdc4-d5bc2fbed9d0	\N	{}
e75e9ad3-2760-4553-8aa2-a8d30fcaab7b	icons	1770697632635-camera.svg	\N	2026-02-10 04:27:12.745072+00	2026-02-10 04:27:12.745072+00	2026-02-10 04:27:12.745072+00	{"eTag": "\\"c6a73463c46b55019db2c037672a0631\\"", "size": 555, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:13.000Z", "contentLength": 555, "httpStatusCode": 200}	04ed8ef0-5c67-4e96-9007-b14ae7665159	\N	{}
2c62a3e5-33c2-45b3-b984-3553ce5a2883	icons	1769409710649-writing-1.svg	\N	2026-01-26 06:41:50.805091+00	2026-01-26 06:41:50.805091+00	2026-01-26 06:41:50.805091+00	{"eTag": "\\"bc24296f19f6e8701e6f184603d44975\\"", "size": 544, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:41:51.000Z", "contentLength": 544, "httpStatusCode": 200}	50ae27cd-ce05-4fae-aa99-1156062a2f63	\N	{}
f968ee5f-9c4c-434a-90f8-3d6964d76a62	icons	1769409710828-writing-2.svg	\N	2026-01-26 06:41:50.993324+00	2026-01-26 06:41:50.993324+00	2026-01-26 06:41:50.993324+00	{"eTag": "\\"62881aebc5e21474fa909df4ab3a3eca\\"", "size": 647, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-26T06:41:51.000Z", "contentLength": 647, "httpStatusCode": 200}	1a052c42-2845-4b6b-9d8f-a47602f9172b	\N	{}
04440751-b3bc-4f06-baf6-5a3043f34ff8	icons	1769554733328-clock.svg	\N	2026-01-27 22:58:53.638437+00	2026-01-27 22:58:53.638437+00	2026-01-27 22:58:53.638437+00	{"eTag": "\\"1d93627d007950f4e0c9ddd1f9b9c5f7\\"", "size": 853, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-27T22:58:54.000Z", "contentLength": 853, "httpStatusCode": 200}	2b266377-0dc8-4cd0-85a0-3c24c529587e	\N	{}
7b3da906-4f4a-4a9b-b805-2f6b1426813d	icons	1770771983812-vdc.svg	\N	2026-02-11 01:06:23.922536+00	2026-02-11 01:06:23.922536+00	2026-02-11 01:06:23.922536+00	{"eTag": "\\"868ec3d040411d00a6a978ec3b162d45\\"", "size": 1636, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:06:24.000Z", "contentLength": 1636, "httpStatusCode": 200}	12b9f13e-bb23-46b3-abf0-b4d21c0cbc69	\N	{}
80dbe22f-085a-4c70-a263-c229fc56d7df	icons	1769554733746-download.svg	\N	2026-01-27 22:58:53.844176+00	2026-01-27 22:58:53.844176+00	2026-01-27 22:58:53.844176+00	{"eTag": "\\"77c00e7f889f5cc9ef6fcee22a2d709c\\"", "size": 606, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-27T22:58:54.000Z", "contentLength": 606, "httpStatusCode": 200}	c19fd65b-59ff-4bae-ab00-bed1b5ea0965	\N	{}
c5009a28-e080-4853-b21a-9caadac92a88	icons	1769554733937-earth.svg	\N	2026-01-27 22:58:54.022123+00	2026-01-27 22:58:54.022123+00	2026-01-27 22:58:54.022123+00	{"eTag": "\\"380dc694cc06148ee98c518847fe23b6\\"", "size": 1085, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-27T22:58:54.000Z", "contentLength": 1085, "httpStatusCode": 200}	92d3347d-3cc8-41e3-8d84-4dc6490ca1ba	\N	{}
72ad9039-3e8a-479c-a822-eb912adea6fe	icons	1769554734115-export.svg	\N	2026-01-27 22:58:54.21039+00	2026-01-27 22:58:54.21039+00	2026-01-27 22:58:54.21039+00	{"eTag": "\\"1d6293eae37741e769f31f8159dcefea\\"", "size": 608, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-27T22:58:55.000Z", "contentLength": 608, "httpStatusCode": 200}	4658455a-1b37-4bb1-93b9-e0237e1b58a7	\N	{}
f3410c8e-07ec-410a-bbbb-f22cba2839dc	icons	1769554734310-sharing.svg	\N	2026-01-27 22:58:54.40605+00	2026-01-27 22:58:54.40605+00	2026-01-27 22:58:54.40605+00	{"eTag": "\\"f9188a9205da1de85f271225a8d9fff9\\"", "size": 668, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-27T22:58:55.000Z", "contentLength": 668, "httpStatusCode": 200}	10f9e2a6-1c13-493b-b364-82bade10eadc	\N	{}
33413162-9bdd-429a-8c3c-e6691bd16b60	icons	1769554734506-sound.svg	\N	2026-01-27 22:58:54.589457+00	2026-01-27 22:58:54.589457+00	2026-01-27 22:58:54.589457+00	{"eTag": "\\"43ca1437101cbadeba1f241414bd501b\\"", "size": 775, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-01-27T22:58:55.000Z", "contentLength": 775, "httpStatusCode": 200}	e5398d43-9f28-430b-bdb4-1f5837e30eee	\N	{}
ed2848be-8a1f-4d29-af15-b4325bb32dc4	icons	1770701806839-cloud-archive.svg	\N	2026-02-10 05:36:46.938332+00	2026-02-10 05:36:46.938332+00	2026-02-10 05:36:46.938332+00	{"eTag": "\\"903148687e88f7f85f7ddb6dc58da08e\\"", "size": 737, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:36:47.000Z", "contentLength": 737, "httpStatusCode": 200}	0e7807f1-c41e-481e-89a2-87dac80dd4a4	\N	{}
8289547f-068c-4524-8447-7feaa8bb727f	icons	1770697632832-click.svg	\N	2026-02-10 04:27:12.929256+00	2026-02-10 04:27:12.929256+00	2026-02-10 04:27:12.929256+00	{"eTag": "\\"34d7f128fb8ab8f0f8f85d35ab1a0407\\"", "size": 731, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:13.000Z", "contentLength": 731, "httpStatusCode": 200}	8e58223a-4e20-4a18-aef1-3b259142d7fa	\N	{}
19cbcd77-ff01-42fb-afca-92ea9d37a6f7	icons	1770697633001-desktop.svg	\N	2026-02-10 04:27:13.094639+00	2026-02-10 04:27:13.094639+00	2026-02-10 04:27:13.094639+00	{"eTag": "\\"5d80903efd024fbdacc7042399a07e70\\"", "size": 693, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:14.000Z", "contentLength": 693, "httpStatusCode": 200}	9862600b-8336-4a05-a2e2-bc9905c1aacd	\N	{}
2ff16b89-f3d0-4188-a59b-80d7dd28975b	icons	1770701806977-cloud-backup.svg	\N	2026-02-10 05:36:47.050401+00	2026-02-10 05:36:47.050401+00	2026-02-10 05:36:47.050401+00	{"eTag": "\\"8b12e3f6e77c47680f978a84e0ba769e\\"", "size": 843, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:36:48.000Z", "contentLength": 843, "httpStatusCode": 200}	56aa595d-160c-4648-8987-9964166f5f7f	\N	{}
ef4bc0f4-84a4-42ff-b001-a17c88089443	icons	1770697633174-documentation.svg	\N	2026-02-10 04:27:13.360764+00	2026-02-10 04:27:13.360764+00	2026-02-10 04:27:13.360764+00	{"eTag": "\\"5c42d1faa79e18b12752a4e4ca2e5fa1\\"", "size": 544, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:14.000Z", "contentLength": 544, "httpStatusCode": 200}	2692842b-efea-412f-9919-821ad252cdab	\N	{}
341d9175-c018-4acd-9e60-fe1c89d0f10c	icons	1770697633437-explorer.svg	\N	2026-02-10 04:27:13.510838+00	2026-02-10 04:27:13.510838+00	2026-02-10 04:27:13.510838+00	{"eTag": "\\"53bc1ab92ac383ad75734ec37a962dea\\"", "size": 521, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:14.000Z", "contentLength": 521, "httpStatusCode": 200}	1cd31c40-4c41-4a22-b9b6-08cf7df18056	\N	{}
50483307-ee75-40e8-b0c3-2725193f0432	icons	1770701807089-cloud-sync.svg	\N	2026-02-10 05:36:47.172543+00	2026-02-10 05:36:47.172543+00	2026-02-10 05:36:47.172543+00	{"eTag": "\\"396c8d0f513ad1ce8b65a04382ef9e47\\"", "size": 1078, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:36:48.000Z", "contentLength": 1078, "httpStatusCode": 200}	342a9dee-23e1-4283-aa8d-e1f293cef95e	\N	{}
03ea71e0-4a13-433a-a3c7-d4b56ed10139	icons	1770701807213-cloud-upload.svg	\N	2026-02-10 05:36:47.301597+00	2026-02-10 05:36:47.301597+00	2026-02-10 05:36:47.301597+00	{"eTag": "\\"a72ab8e562e48232ceaa7e641cd328e0\\"", "size": 844, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:36:48.000Z", "contentLength": 844, "httpStatusCode": 200}	d342c38a-f627-440f-88c1-c4792c109ab6	\N	{}
1e008bf2-161b-4299-88e6-0c7347e7990e	icons	1770701807356-cloud.svg	\N	2026-02-10 05:36:47.456973+00	2026-02-10 05:36:47.456973+00	2026-02-10 05:36:47.456973+00	{"eTag": "\\"5157dbbba298244eb51ffca07ed4ba30\\"", "size": 628, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:36:48.000Z", "contentLength": 628, "httpStatusCode": 200}	56e57fc6-8590-4cb9-9906-db4efd96df66	\N	{}
ca75f7df-205f-4e83-b21f-a6e04352c024	icons	1770701885978-net.svg	\N	2026-02-10 05:38:06.086809+00	2026-02-10 05:38:06.086809+00	2026-02-10 05:38:06.086809+00	{"eTag": "\\"77e77300e10c2916a87276ab21c45588\\"", "size": 1047, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:07.000Z", "contentLength": 1047, "httpStatusCode": 200}	59962c60-dd23-42dc-b66d-a47d301489e5	\N	{}
e8819b92-7054-4657-aadf-c8c9308f7503	icons	1770701886149-network.svg	\N	2026-02-10 05:38:06.248937+00	2026-02-10 05:38:06.248937+00	2026-02-10 05:38:06.248937+00	{"eTag": "\\"65ee5e8a0fc8c1b279dd705de38e9e5a\\"", "size": 1157, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:07.000Z", "contentLength": 1157, "httpStatusCode": 200}	1cb92c3e-38f2-4acb-9d22-3adc14ab1305	\N	{}
d9af7a7b-71de-4e97-b342-e24638708802	icons	1770701886301-not-access.svg	\N	2026-02-10 05:38:06.422461+00	2026-02-10 05:38:06.422461+00	2026-02-10 05:38:06.422461+00	{"eTag": "\\"84085de07eb6637a27678871d52ac55c\\"", "size": 566, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:07.000Z", "contentLength": 566, "httpStatusCode": 200}	d25d3bc1-ccc3-4cb4-b46f-98f72fc893cc	\N	{}
0807ae5a-fa52-49d3-86f3-ea030713fd0b	icons	1770701886476-ntp-server.svg	\N	2026-02-10 05:38:06.566738+00	2026-02-10 05:38:06.566738+00	2026-02-10 05:38:06.566738+00	{"eTag": "\\"5df7fc6a4db0eddd24d19e13dd77c77c\\"", "size": 919, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:07.000Z", "contentLength": 919, "httpStatusCode": 200}	511c91aa-27a5-4e9c-b9b4-2a7b3e8699b5	\N	{}
e7e155a7-1286-45d2-bd19-e54a3897c62b	icons	1771466035416-ars.svg	\N	2026-02-19 01:53:55.529043+00	2026-02-19 01:53:55.529043+00	2026-02-19 01:53:55.529043+00	{"eTag": "\\"3c0418c798e8e359cdbbcca96dd1669b\\"", "size": 1606, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:53:56.000Z", "contentLength": 1606, "httpStatusCode": 200}	f847805a-d83c-413e-ab8d-8d419820218d	\N	{}
1606f037-2425-488c-b799-e476682a4351	icons	1770768226779-base-station1.svg	\N	2026-02-11 00:03:47.366122+00	2026-02-11 00:03:47.366122+00	2026-02-11 00:03:47.366122+00	{"eTag": "\\"782728740571a3bdbb810dbc8749440e\\"", "size": 1045, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:03:48.000Z", "contentLength": 1045, "httpStatusCode": 200}	5bf193e0-794d-4b11-931a-f2f5af716ddd	\N	{}
80719273-ac5d-4719-b624-f02162eafe83	icons	1770697651588-finger.svg	\N	2026-02-10 04:27:31.697716+00	2026-02-10 04:27:31.697716+00	2026-02-10 04:27:31.697716+00	{"eTag": "\\"14b73f73a4f3fe2fd884f7ab920725cd\\"", "size": 895, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:32.000Z", "contentLength": 895, "httpStatusCode": 200}	c808af9f-f25b-40ca-8281-907efb9410c4	\N	{}
8a35e97b-ba6c-4fc2-97aa-2bcf6b2f7d35	icons	1770768227489-base-station2.svg	\N	2026-02-11 00:03:47.606203+00	2026-02-11 00:03:47.606203+00	2026-02-11 00:03:47.606203+00	{"eTag": "\\"83dbf7899d23fab77378190cc7312562\\"", "size": 1171, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:03:48.000Z", "contentLength": 1171, "httpStatusCode": 200}	e5226d28-2eb8-4e79-b42f-4598f2116d85	\N	{}
57f1b50c-a57d-423d-8685-f9a61a044acd	icons	1770701830011-db-encryption.svg	\N	2026-02-10 05:37:10.1302+00	2026-02-10 05:37:10.1302+00	2026-02-10 05:37:10.1302+00	{"eTag": "\\"2298cc8b55d0d2eaf40259179d56e436\\"", "size": 1243, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:11.000Z", "contentLength": 1243, "httpStatusCode": 200}	b9983cb4-50ed-49c4-949a-11417e85ccf3	\N	{}
f80e0a08-32ac-4dfd-a3a4-b03fbd65743c	icons	1770697651774-folder1.svg	\N	2026-02-10 04:27:31.876664+00	2026-02-10 04:27:31.876664+00	2026-02-10 04:27:31.876664+00	{"eTag": "\\"1e107d1422de43ab57cdaff9bfc4d0f7\\"", "size": 479, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:32.000Z", "contentLength": 479, "httpStatusCode": 200}	082a9b95-3976-40e1-aa42-4de939c89237	\N	{}
2bf8c87b-2b9c-4cd7-999e-95020eae5ad2	icons	1770697651962-folder2.svg	\N	2026-02-10 04:27:32.061099+00	2026-02-10 04:27:32.061099+00	2026-02-10 04:27:32.061099+00	{"eTag": "\\"07e84eab686e9772f7e2f6a3f765a7cd\\"", "size": 600, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:33.000Z", "contentLength": 600, "httpStatusCode": 200}	92a86b7a-3755-46cd-87e0-09db2681631a	\N	{}
94390b89-7f36-44ba-bcae-dc490666d0c9	icons	1770701830301-db-server.svg	\N	2026-02-10 05:37:10.402201+00	2026-02-10 05:37:10.402201+00	2026-02-10 05:37:10.402201+00	{"eTag": "\\"b0dcb9482ecc06736a1d7894a69f381b\\"", "size": 1504, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:11.000Z", "contentLength": 1504, "httpStatusCode": 200}	ec4f12c5-2392-40d2-8b94-7b68b7b7f31e	\N	{}
ca455e0c-351c-4afa-b405-6650aa3d1e89	icons	1770697652226-hand.svg	\N	2026-02-10 04:27:32.322468+00	2026-02-10 04:27:32.322468+00	2026-02-10 04:27:32.322468+00	{"eTag": "\\"1abac5ceb10c966eac9a997274be5066\\"", "size": 735, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:33.000Z", "contentLength": 735, "httpStatusCode": 200}	2888a36c-0b29-42ab-b087-3e41c84a0b21	\N	{}
b45b7076-c9a8-42e4-a462-4e78d1de4b60	icons	1770697652420-hart.svg	\N	2026-02-10 04:27:32.516419+00	2026-02-10 04:27:32.516419+00	2026-02-10 04:27:32.516419+00	{"eTag": "\\"c68fd5c3b2721f2aa81caa34a718b717\\"", "size": 702, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:33.000Z", "contentLength": 702, "httpStatusCode": 200}	e55a4ded-bd66-4fb6-a5f6-20056326da2e	\N	{}
c511c49b-d4ea-40f7-b4fe-0085cc508dd8	icons	1770701830456-db.svg	\N	2026-02-10 05:37:10.536204+00	2026-02-10 05:37:10.536204+00	2026-02-10 05:37:10.536204+00	{"eTag": "\\"135f18249757c29f53bd7ba0fad6c5e9\\"", "size": 1098, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:11.000Z", "contentLength": 1098, "httpStatusCode": 200}	0e1c8e6b-56e2-4805-be13-13f494b37b77	\N	{}
957132ce-85e2-423c-8687-000757d653cd	icons	1770697670630-inquiry.svg	\N	2026-02-10 04:27:50.739333+00	2026-02-10 04:27:50.739333+00	2026-02-10 04:27:50.739333+00	{"eTag": "\\"66b7e5577e0d4a9807c57d5a7a02fe1d\\"", "size": 610, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:51.000Z", "contentLength": 610, "httpStatusCode": 200}	d6f9f578-8ad8-4e62-afb4-c51a9718edc9	\N	{}
8bf00d02-dc50-4b3c-92ad-de12a7e865d2	icons	1770697670826-items.svg	\N	2026-02-10 04:27:50.912419+00	2026-02-10 04:27:50.912419+00	2026-02-10 04:27:50.912419+00	{"eTag": "\\"c66ac711df81c30190e35068660695bf\\"", "size": 1052, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:51.000Z", "contentLength": 1052, "httpStatusCode": 200}	c22c42f2-a7eb-49a6-91c4-c25724d98223	\N	{}
4ee77811-5592-449d-b095-4ed0c7a86278	icons	1770701830587-de.svg	\N	2026-02-10 05:37:10.691606+00	2026-02-10 05:37:10.691606+00	2026-02-10 05:37:10.691606+00	{"eTag": "\\"9593d00c7efb52f1bda530302627dc0c\\"", "size": 4375, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:11.000Z", "contentLength": 4375, "httpStatusCode": 200}	4f2fc49b-853d-4523-bd99-cba8fce626a0	\N	{}
f0911b02-9100-4216-8ad7-1f5ad8fde2b8	icons	1770697670988-labtop.svg	\N	2026-02-10 04:27:51.064498+00	2026-02-10 04:27:51.064498+00	2026-02-10 04:27:51.064498+00	{"eTag": "\\"6e8b7d02561010a17e7f402ca57d510a\\"", "size": 636, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:52.000Z", "contentLength": 636, "httpStatusCode": 200}	63ed6654-43d2-4ce5-ac16-c4fb3085d375	\N	{}
d2250201-b9b7-4391-917e-466d80cf7c54	icons	1770697671135-like.svg	\N	2026-02-10 04:27:51.221503+00	2026-02-10 04:27:51.221503+00	2026-02-10 04:27:51.221503+00	{"eTag": "\\"fcac73f6e827799d0b10ecf79a940c95\\"", "size": 887, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:52.000Z", "contentLength": 887, "httpStatusCode": 200}	d5d426c7-6519-4c11-99ab-ba456e5ab4b5	\N	{}
57f2c2e5-4db3-4374-9088-906442ab0385	icons	1770701830926-directory-server.svg	\N	2026-02-10 05:37:11.048447+00	2026-02-10 05:37:11.048447+00	2026-02-10 05:37:11.048447+00	{"eTag": "\\"9d3f2bb49129a4add3bf2a5b0c0ce4a8\\"", "size": 940, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:12.000Z", "contentLength": 940, "httpStatusCode": 200}	5194f002-1e09-477c-b8f4-0c837c9f2fbe	\N	{}
f395cf28-ca74-44f3-b712-bc1bc99cdc1d	icons	1770701831102-dp.svg	\N	2026-02-10 05:37:11.212935+00	2026-02-10 05:37:11.212935+00	2026-02-10 05:37:11.212935+00	{"eTag": "\\"3773b9ff641cd3032c76920fdaf6f6ea\\"", "size": 4746, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:12.000Z", "contentLength": 4746, "httpStatusCode": 200}	67f8214f-0903-4d61-9b4e-0d4303896e37	\N	{}
0255a3fa-7e61-4f5d-b5d6-5f4488a6f926	icons	1770697671293-music.svg	\N	2026-02-10 04:27:51.391337+00	2026-02-10 04:27:51.391337+00	2026-02-10 04:27:51.391337+00	{"eTag": "\\"5d8d3d2910bc6bc01afe3d46bfcfe85e\\"", "size": 652, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:27:52.000Z", "contentLength": 652, "httpStatusCode": 200}	f40958cd-dd10-43c5-b5b4-0f6966b3f150	\N	{}
17963205-af98-49ad-bc9e-5c4df4aa57a8	icons	1770701846159-encryption1.svg	\N	2026-02-10 05:37:26.277851+00	2026-02-10 05:37:26.277851+00	2026-02-10 05:37:26.277851+00	{"eTag": "\\"d6da628c7dbdefcf1b71f8ccebe38163\\"", "size": 556, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:27.000Z", "contentLength": 556, "httpStatusCode": 200}	531e70c8-dd44-4e87-828d-7d911463ffb0	\N	{}
6262cffd-7424-4ddd-b16d-93c6074183a3	icons	1770697718500-tablet.svg	\N	2026-02-10 04:28:38.611533+00	2026-02-10 04:28:38.611533+00	2026-02-10 04:28:38.611533+00	{"eTag": "\\"aae164720b91366f7cc5a4656ba83de0\\"", "size": 527, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:39.000Z", "contentLength": 527, "httpStatusCode": 200}	4a734432-1da9-4834-989d-93cfe1ce495f	\N	{}
5702a4db-cf83-40ea-b8a1-6cc12cd08185	icons	1770768227666-base-station3.svg	\N	2026-02-11 00:03:47.753816+00	2026-02-11 00:03:47.753816+00	2026-02-11 00:03:47.753816+00	{"eTag": "\\"0dea27e8c2b319f8d2ba9bdb8219c08a\\"", "size": 1028, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:03:48.000Z", "contentLength": 1028, "httpStatusCode": 200}	0221e003-1831-4d8d-8342-a955f0ea4199	\N	{}
1bd494d6-5bc7-4ece-b6e4-dcf205de0b22	icons	1770697718671-user-add.svg	\N	2026-02-10 04:28:38.762201+00	2026-02-10 04:28:38.762201+00	2026-02-10 04:28:38.762201+00	{"eTag": "\\"c0a7dacce7b16d7f661d391d3aa10ac5\\"", "size": 823, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:39.000Z", "contentLength": 823, "httpStatusCode": 200}	4f5c04ec-9e3a-4051-80e2-8caea2db09fc	\N	{}
6309a2db-6006-4a90-9a88-d68a7cb3c0d1	icons	1770701846342-encryption2.svg	\N	2026-02-10 05:37:26.45072+00	2026-02-10 05:37:26.45072+00	2026-02-10 05:37:26.45072+00	{"eTag": "\\"1382f6845409ef85467131c12aa2d3ae\\"", "size": 554, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:27.000Z", "contentLength": 554, "httpStatusCode": 200}	5ff84709-1c02-4ee1-97f6-58754bba2a64	\N	{}
f24c1d1d-2f91-420a-ac86-b2ed5f2a7d8b	icons	1770697718817-user-search.svg	\N	2026-02-10 04:28:38.896588+00	2026-02-10 04:28:38.896588+00	2026-02-10 04:28:38.896588+00	{"eTag": "\\"6ec9632e2f3c004492a69f9c80b0b074\\"", "size": 956, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:39.000Z", "contentLength": 956, "httpStatusCode": 200}	5f573fad-4f13-435d-8db3-1ec5680e94e5	\N	{}
a78f457a-69dd-4119-b7cf-90c1180a1c18	icons	1770697718954-user.svg	\N	2026-02-10 04:28:39.04849+00	2026-02-10 04:28:39.04849+00	2026-02-10 04:28:39.04849+00	{"eTag": "\\"beefe99f62e0336cea5c04f680544ec3\\"", "size": 572, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:40.000Z", "contentLength": 572, "httpStatusCode": 200}	8027e5d1-f903-46f4-95eb-465c4068cf60	\N	{}
5057f7f0-46b0-49d4-980c-bba1408e1a2f	icons	1770701846507-firewall.svg	\N	2026-02-10 05:37:26.62682+00	2026-02-10 05:37:26.62682+00	2026-02-10 05:37:26.62682+00	{"eTag": "\\"9dfeb3693a4e8419c057c30c8fd5eda8\\"", "size": 1402, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:27.000Z", "contentLength": 1402, "httpStatusCode": 200}	72c6a5d7-4bbf-41fa-b263-4a5bafb0af06	\N	{}
fd77f087-da7a-47a1-b56d-31e04ee88f6b	icons	1770697719105-visitors.svg	\N	2026-02-10 04:28:39.186953+00	2026-02-10 04:28:39.186953+00	2026-02-10 04:28:39.186953+00	{"eTag": "\\"8186114dbe0052e52ab8a9302d163058\\"", "size": 831, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:40.000Z", "contentLength": 831, "httpStatusCode": 200}	81072e71-06db-4800-a1c6-1608e0cf9dee	\N	{}
c9d3709d-e103-4c90-a598-647cd7294441	icons	1770768227820-bot.svg	\N	2026-02-11 00:03:47.888712+00	2026-02-11 00:03:47.888712+00	2026-02-11 00:03:47.888712+00	{"eTag": "\\"660d569e5b6ffa0cbc34a0bba11fa58c\\"", "size": 1053, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:03:48.000Z", "contentLength": 1053, "httpStatusCode": 200}	62284966-0003-4030-a3e9-e4cb9ddd3664	\N	{}
187268a8-c54b-459c-871d-1166309005ab	icons	1770697719245-wifi.svg	\N	2026-02-10 04:28:39.344375+00	2026-02-10 04:28:39.344375+00	2026-02-10 04:28:39.344375+00	{"eTag": "\\"788baebf3e7430b13dca90eff7e76696\\"", "size": 734, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:40.000Z", "contentLength": 734, "httpStatusCode": 200}	0c2a1ff3-e83f-4e65-96ee-d0ae361e07c4	\N	{}
f2e3850d-982d-417d-8d2b-33f7c07c15bc	icons	1770701846674-gps.svg	\N	2026-02-10 05:37:26.767503+00	2026-02-10 05:37:26.767503+00	2026-02-10 05:37:26.767503+00	{"eTag": "\\"54a162e5411365fc84f822966a281e6c\\"", "size": 1071, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:27.000Z", "contentLength": 1071, "httpStatusCode": 200}	04340a49-9d57-4cb4-adc0-5d17ee76a8b9	\N	{}
a3e4c480-466b-4d4a-860d-a1faa5296234	icons	1770701846838-haker1.svg	\N	2026-02-10 05:37:26.964048+00	2026-02-10 05:37:26.964048+00	2026-02-10 05:37:26.964048+00	{"eTag": "\\"2e95a30042546b2ccabf49bcecc3ed7c\\"", "size": 999, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:27.000Z", "contentLength": 999, "httpStatusCode": 200}	6fd80333-188c-444a-9bed-c792433925d1	\N	{}
52d3a3a3-a628-4659-8e18-1ab66635df2a	icons	1770701847017-haker2.svg	\N	2026-02-10 05:37:27.115961+00	2026-02-10 05:37:27.115961+00	2026-02-10 05:37:27.115961+00	{"eTag": "\\"4586f8c8f39a32fe5598c5a50a248752\\"", "size": 1255, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:28.000Z", "contentLength": 1255, "httpStatusCode": 200}	58e1c0b2-52a0-43d4-9035-e036cb8895cf	\N	{}
4ca3ec50-1e80-407b-aeda-e63290a51cd2	icons	1770701847177-internet.svg	\N	2026-02-10 05:37:27.278224+00	2026-02-10 05:37:27.278224+00	2026-02-10 05:37:27.278224+00	{"eTag": "\\"49f5ed1766aaaee72c91bb904e923c64\\"", "size": 738, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:28.000Z", "contentLength": 738, "httpStatusCode": 200}	9e1d4ce0-4623-4c05-a448-b2ebdf515917	\N	{}
8794af9e-c8c3-4a39-906f-1303dd5c4795	icons	1770701847327-key-manage.svg	\N	2026-02-10 05:37:27.423271+00	2026-02-10 05:37:27.423271+00	2026-02-10 05:37:27.423271+00	{"eTag": "\\"79bc1c20f10d9c165295929f9c350245\\"", "size": 721, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:28.000Z", "contentLength": 721, "httpStatusCode": 200}	06ff2cc7-0de5-44ec-b83d-ade7116dbb99	\N	{}
9905595b-2abb-4ba4-bb6f-228358422d27	icons	1770697688457-people.svg	\N	2026-02-10 04:28:08.552431+00	2026-02-10 04:28:08.552431+00	2026-02-10 04:28:08.552431+00	{"eTag": "\\"840c2dacdeb39f760678c272267a64c3\\"", "size": 895, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:09.000Z", "contentLength": 895, "httpStatusCode": 200}	7ad9bc7e-ea7c-42bd-98b2-da3b9cff83d6	\N	{}
4be17ddf-825a-46aa-bd6e-480ca16d8da0	icons	1770701847485-key-management.svg	\N	2026-02-10 05:37:27.599362+00	2026-02-10 05:37:27.599362+00	2026-02-10 05:37:27.599362+00	{"eTag": "\\"6bd3f215efeec5451f2a61ba00b3ad36\\"", "size": 990, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:28.000Z", "contentLength": 990, "httpStatusCode": 200}	c8eab7e2-c598-44dc-839c-954fde5658ea	\N	{}
c2a9a138-185f-4f69-abf6-cffc2c2e06b8	icons	1770697688629-person.svg	\N	2026-02-10 04:28:08.726325+00	2026-02-10 04:28:08.726325+00	2026-02-10 04:28:08.726325+00	{"eTag": "\\"d5bb52d1c540906f2c6934fd231e3435\\"", "size": 643, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:09.000Z", "contentLength": 643, "httpStatusCode": 200}	f08bf7c5-ccc9-4232-b784-39f8736ee6a6	\N	{}
f04dc7bb-3d2a-4a77-ac95-fd86233f47aa	icons	1770768227955-bulldozer.svg	\N	2026-02-11 00:03:48.035308+00	2026-02-11 00:03:48.035308+00	2026-02-11 00:03:48.035308+00	{"eTag": "\\"0749e2ff5bd72ba46202ec44769c6039\\"", "size": 855, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:03:48.000Z", "contentLength": 855, "httpStatusCode": 200}	60c3d6f5-a7f9-4e24-bff0-ca223d2a2350	\N	{}
c0e6d878-170a-4af9-ba4f-eb94cb458e8d	icons	1770697688800-phone.svg	\N	2026-02-10 04:28:08.891159+00	2026-02-10 04:28:08.891159+00	2026-02-10 04:28:08.891159+00	{"eTag": "\\"5cdac91334ce23abe8a480c2dfb10329\\"", "size": 786, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:09.000Z", "contentLength": 786, "httpStatusCode": 200}	54e5a0c4-99c7-4b90-b976-2df986e7fca2	\N	{}
b50b5f8a-fdbb-409a-84a9-981e22dc18c0	icons	1770701847655-key1.svg	\N	2026-02-10 05:37:27.748686+00	2026-02-10 05:37:27.748686+00	2026-02-10 05:37:27.748686+00	{"eTag": "\\"29012e4ab389724d24944832fa7c7f82\\"", "size": 580, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:37:28.000Z", "contentLength": 580, "httpStatusCode": 200}	c7576e88-d94c-4cad-b9a3-e884f0adef3f	\N	{}
beb2a2e6-974f-400f-ad8c-8e86f1cb3ae3	icons	1770697688964-position.svg	\N	2026-02-10 04:28:09.044124+00	2026-02-10 04:28:09.044124+00	2026-02-10 04:28:09.044124+00	{"eTag": "\\"0c5090461b31cad78b255a4b849ed44e\\"", "size": 590, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:10.000Z", "contentLength": 590, "httpStatusCode": 200}	bfc7efac-7210-4c44-ac80-7fc5db3eb651	\N	{}
22cf9f2e-6517-4ef2-9157-3f0dce02b695	icons	1770701886746-pki-server.svg	\N	2026-02-10 05:38:06.838582+00	2026-02-10 05:38:06.838582+00	2026-02-10 05:38:06.838582+00	{"eTag": "\\"822160ef0f4c5e103294c2007695a2eb\\"", "size": 889, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:07.000Z", "contentLength": 889, "httpStatusCode": 200}	aec9436f-46a4-425c-a9b0-5361cbf10e31	\N	{}
0048387f-ed1d-4af2-aef0-ba5d26fb7af9	icons	1770697701666-smart-watch.svg	\N	2026-02-10 04:28:21.778351+00	2026-02-10 04:28:21.778351+00	2026-02-10 04:28:21.778351+00	{"eTag": "\\"cae14c6487431226977fa337e485521f\\"", "size": 958, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:22.000Z", "contentLength": 958, "httpStatusCode": 200}	5577c73c-21c2-4f3a-a029-20963af9dba9	\N	{}
8d7d645e-9fd2-4b66-8ccf-13c6c2f56f12	icons	1770701913143-server.svg	\N	2026-02-10 05:38:33.241137+00	2026-02-10 05:38:33.241137+00	2026-02-10 05:38:33.241137+00	{"eTag": "\\"546b18913653a26a335d5f515a358d51\\"", "size": 631, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:34.000Z", "contentLength": 631, "httpStatusCode": 200}	2d68dcb3-f827-4e89-9e8c-5d4544b5f4a7	\N	{}
a832fc3e-18e0-49e5-81e7-0dca38884ea0	icons	1770697701946-smartphone-android.svg	\N	2026-02-10 04:28:22.066684+00	2026-02-10 04:28:22.066684+00	2026-02-10 04:28:22.066684+00	{"eTag": "\\"a8e8e3d09afa3a1a7d61f69295f4d97f\\"", "size": 618, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:23.000Z", "contentLength": 618, "httpStatusCode": 200}	c41103b0-ebfd-4a0a-831e-2d75b8ac5fde	\N	{}
9bb46928-4f09-40a3-92d2-b0ef44a88d66	icons	1770697702128-smartphone-ios.svg	\N	2026-02-10 04:28:22.217646+00	2026-02-10 04:28:22.217646+00	2026-02-10 04:28:22.217646+00	{"eTag": "\\"cb5dbbc1f92e06a2557f968746c1b35e\\"", "size": 574, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:23.000Z", "contentLength": 574, "httpStatusCode": 200}	89008625-c2be-445a-a2c6-7c2db8c48282	\N	{}
719b3da5-0302-4f67-b346-89ca206df581	icons	1770701913291-shield1.svg	\N	2026-02-10 05:38:33.388199+00	2026-02-10 05:38:33.388199+00	2026-02-10 05:38:33.388199+00	{"eTag": "\\"ef0fffe0e0afb25e5f8f7b781baeb94c\\"", "size": 482, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:34.000Z", "contentLength": 482, "httpStatusCode": 200}	bb6933c2-5b7e-4014-9227-b539a34cd780	\N	{}
df4215e5-f8a4-48a8-b6ab-b2bdaad7038a	icons	1770697702281-star.svg	\N	2026-02-10 04:28:22.370664+00	2026-02-10 04:28:22.370664+00	2026-02-10 04:28:22.370664+00	{"eTag": "\\"f97c31c41253254ad2ae656e4cc17744\\"", "size": 526, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T04:28:23.000Z", "contentLength": 526, "httpStatusCode": 200}	1aeddf0c-9c0c-4955-8f20-0ba6102446e5	\N	{}
d78a0d28-36c0-4d1b-8d55-4b315d106d1f	icons	1770701913433-shield2.svg	\N	2026-02-10 05:38:33.547251+00	2026-02-10 05:38:33.547251+00	2026-02-10 05:38:33.547251+00	{"eTag": "\\"09e752e1afac5d27e99e8c9065edd26e\\"", "size": 567, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:34.000Z", "contentLength": 567, "httpStatusCode": 200}	258a6e96-2c0b-4bcc-acbc-8c19666f035c	\N	{}
bb96e536-71db-49b4-81c8-e3341fa3265e	icons	1770701913599-shield3.svg	\N	2026-02-10 05:38:33.711187+00	2026-02-10 05:38:33.711187+00	2026-02-10 05:38:33.711187+00	{"eTag": "\\"7abe41f2ba4e15a0a09d9e2c40ce8ef7\\"", "size": 738, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:34.000Z", "contentLength": 738, "httpStatusCode": 200}	f906612b-39ef-420e-91d5-2f69d37b337f	\N	{}
9168c56a-aa35-4c67-984b-0f7511d8a585	icons	1770701913768-smpt-server.svg	\N	2026-02-10 05:38:33.872054+00	2026-02-10 05:38:33.872054+00	2026-02-10 05:38:33.872054+00	{"eTag": "\\"1a067ad26ea002de6d72f4a0c7af05a9\\"", "size": 995, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:34.000Z", "contentLength": 995, "httpStatusCode": 200}	8bb57558-1c3d-40bc-a5a7-8d53ff64faf9	\N	{}
cf3d5b20-74ea-4473-9440-a2d0d7801189	icons	1770701913921-switch-atm.svg	\N	2026-02-10 05:38:34.025357+00	2026-02-10 05:38:34.025357+00	2026-02-10 05:38:34.025357+00	{"eTag": "\\"276b64e669b217a952547f5672d1b2a0\\"", "size": 1086, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:34.000Z", "contentLength": 1086, "httpStatusCode": 200}	7c13a8d4-c712-4e4e-a34b-e31a31dbb491	\N	{}
065533cc-eab5-40f4-839c-9dd3d3ab1249	icons	1770771983982-warning-light.svg	\N	2026-02-11 01:06:24.065299+00	2026-02-11 01:06:24.065299+00	2026-02-11 01:06:24.065299+00	{"eTag": "\\"e9bb3b126d64288e904531097c4b2a2a\\"", "size": 783, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:06:25.000Z", "contentLength": 783, "httpStatusCode": 200}	399a899f-937e-4729-aed4-a191c79d8254	\N	{}
a50638c9-f931-4125-881d-9be7bb3c0695	icons	1770701914077-switch-l2.svg	\N	2026-02-10 05:38:34.234323+00	2026-02-10 05:38:34.234323+00	2026-02-10 05:38:34.234323+00	{"eTag": "\\"505f5a68c65b527c09a48e58291306a2\\"", "size": 1161, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:35.000Z", "contentLength": 1161, "httpStatusCode": 200}	fe21a365-d636-4d66-970b-16e355a2c611	\N	{}
471119c3-0afc-429e-92b4-057661f3d72e	icons	1770768253583-car-suv_taxi.svg	\N	2026-02-11 00:04:13.731545+00	2026-02-11 00:04:13.731545+00	2026-02-11 00:04:13.731545+00	{"eTag": "\\"5d19f89b77c580d47ba7690b0cf9c3a7\\"", "size": 1578, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:04:14.000Z", "contentLength": 1578, "httpStatusCode": 200}	a5926ea1-77c1-4d7c-847d-69fc62a98f1d	\N	{}
5b33f663-52bb-47d5-91d2-a9a45c142809	icons	1770701914287-switch-l3.svg	\N	2026-02-10 05:38:34.375394+00	2026-02-10 05:38:34.375394+00	2026-02-10 05:38:34.375394+00	{"eTag": "\\"1bcbc948cf4412878883243c985459e2\\"", "size": 1223, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:35.000Z", "contentLength": 1223, "httpStatusCode": 200}	e6b6ae2a-223d-48c7-a5fd-4d6780ed5d32	\N	{}
b32925ca-77c9-457e-97cd-f80cf76fbbd0	icons	1770701914435-switch-l4.svg	\N	2026-02-10 05:38:34.526998+00	2026-02-10 05:38:34.526998+00	2026-02-10 05:38:34.526998+00	{"eTag": "\\"ca2e171e7842e07fbccb2d45f41bee96\\"", "size": 1280, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:35.000Z", "contentLength": 1280, "httpStatusCode": 200}	08fe8f2e-8fb7-48d7-bc5d-9405dea7bb55	\N	{}
6c3d1366-1358-4a3c-b0ee-95a6b38bc779	icons	1770768253925-car-suv-ev.svg	\N	2026-02-11 00:04:14.044214+00	2026-02-11 00:04:14.044214+00	2026-02-11 00:04:14.044214+00	{"eTag": "\\"832119065f20e602fcb83c9a38910c48\\"", "size": 1266, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:04:14.000Z", "contentLength": 1266, "httpStatusCode": 200}	6d57c792-0b38-4296-ae1e-5a9c717692d4	\N	{}
f2ac67be-138d-46b2-b928-a24a6998c076	icons	1770701914573-switch-normal.svg	\N	2026-02-10 05:38:34.663869+00	2026-02-10 05:38:34.663869+00	2026-02-10 05:38:34.663869+00	{"eTag": "\\"8f2e7fdde8bb84f85f60b1078a288332\\"", "size": 1223, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:35.000Z", "contentLength": 1223, "httpStatusCode": 200}	975f55ef-251b-4127-9cb8-683eead9e8a8	\N	{}
853fa4e6-5dfa-4807-adff-83f1fe6f918f	icons	1770771984126-weather.svg	\N	2026-02-11 01:06:24.241717+00	2026-02-11 01:06:24.241717+00	2026-02-11 01:06:24.241717+00	{"eTag": "\\"2b1327cccfec537373e520a3a519acb7\\"", "size": 1084, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:06:25.000Z", "contentLength": 1084, "httpStatusCode": 200}	edb46af5-13ce-41e7-afd9-edf4669d8d22	\N	{}
699a3ec2-978c-4a5f-be29-756cdb88d33c	icons	1770701914723-switch-san.svg	\N	2026-02-10 05:38:34.819139+00	2026-02-10 05:38:34.819139+00	2026-02-10 05:38:34.819139+00	{"eTag": "\\"f32635c2c8c9611f332fc01c0567ff64\\"", "size": 2061, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:35.000Z", "contentLength": 2061, "httpStatusCode": 200}	c781963b-a40f-479e-8e61-0639bb67220a	\N	{}
cd999e10-5576-4d6f-a2e0-d576c5808128	icons	1770768254103-car-suv.svg	\N	2026-02-11 00:04:14.171429+00	2026-02-11 00:04:14.171429+00	2026-02-11 00:04:14.171429+00	{"eTag": "\\"72d11b01029b9888d714efc33103d346\\"", "size": 1160, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:04:15.000Z", "contentLength": 1160, "httpStatusCode": 200}	36eef1cf-649a-4632-b1d1-345c72fbf06a	\N	{}
1beb446e-43aa-4599-af6a-b2764b558ab4	icons	1770768254233-card-reader.svg	\N	2026-02-11 00:04:14.36446+00	2026-02-11 00:04:14.36446+00	2026-02-11 00:04:14.36446+00	{"eTag": "\\"4f544536d3f470393868a0c8d29a99e6\\"", "size": 1260, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:04:15.000Z", "contentLength": 1260, "httpStatusCode": 200}	6d4816bd-a20e-49d5-a63b-b2a80f4e40fd	\N	{}
7aea654e-5573-401e-8ac4-9240a9955a60	icons	1770771984306-wiper.svg	\N	2026-02-11 01:06:24.42361+00	2026-02-11 01:06:24.42361+00	2026-02-11 01:06:24.42361+00	{"eTag": "\\"6211e2d02f1ba735257b31df59ac121f\\"", "size": 787, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:06:25.000Z", "contentLength": 787, "httpStatusCode": 200}	9c5cd16d-8e58-4a38-a951-41aec684466d	\N	{}
ef3b9550-31ee-4d28-87f5-96399be4b013	icons	1770768254428-cargo-ship.svg	\N	2026-02-11 00:04:14.565285+00	2026-02-11 00:04:14.565285+00	2026-02-11 00:04:14.565285+00	{"eTag": "\\"7d7abefd1c9896a0fb13243904ca9fa7\\"", "size": 1186, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:04:15.000Z", "contentLength": 1186, "httpStatusCode": 200}	2ee2bcb0-164f-4b16-a918-56a1827d28f3	\N	{}
6d1fbd36-6a4d-419d-8346-a61c698691fe	icons	1770768254635-data-leakage.svg	\N	2026-02-11 00:04:14.726002+00	2026-02-11 00:04:14.726002+00	2026-02-11 00:04:14.726002+00	{"eTag": "\\"cc6ad0299883bd93c6b8195c94782354\\"", "size": 1855, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:04:15.000Z", "contentLength": 1855, "httpStatusCode": 200}	ade3af41-98ca-4120-a291-6c7225b0301e	\N	{}
ab2571c9-2862-4e36-a4eb-960bb4012404	icons	1770768254787-electrocardiogram.svg	\N	2026-02-11 00:04:14.881655+00	2026-02-11 00:04:14.881655+00	2026-02-11 00:04:14.881655+00	{"eTag": "\\"1c60f010c832abd11f0f107b9021995f\\"", "size": 770, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:04:15.000Z", "contentLength": 770, "httpStatusCode": 200}	b9c883c5-6418-4bdb-9668-5f39f094b613	\N	{}
c271a5a3-8ccb-43ff-b65d-48e9c27ec56e	icons	1770768254945-excavator.svg	\N	2026-02-11 00:04:15.035869+00	2026-02-11 00:04:15.035869+00	2026-02-11 00:04:15.035869+00	{"eTag": "\\"887b6252e4052930ec1ad6d42eb42a99\\"", "size": 817, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:04:16.000Z", "contentLength": 817, "httpStatusCode": 200}	9e561c74-c6d9-4f2c-8445-aa098f67b106	\N	{}
8371c4bc-285e-4150-b2aa-3afed6fa9db6	icons	1770701930873-threat-1.svg	\N	2026-02-10 05:38:50.991062+00	2026-02-10 05:38:50.991062+00	2026-02-10 05:38:50.991062+00	{"eTag": "\\"4a7f3eb308a88f1f94915e9327fc8543\\"", "size": 758, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:51.000Z", "contentLength": 758, "httpStatusCode": 200}	945ffb5e-012f-4037-9dd8-c8d0c08d0b13	\N	{}
04973698-4422-40ad-a3a5-62da59956541	icons	1770768334054-fork-lift.svg	\N	2026-02-11 00:05:34.159818+00	2026-02-11 00:05:34.159818+00	2026-02-11 00:05:34.159818+00	{"eTag": "\\"c7636b3e2a457f723d3ea3a6ad4abe8b\\"", "size": 874, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:05:35.000Z", "contentLength": 874, "httpStatusCode": 200}	f5352bc8-517f-4f1c-94e9-f848cdc76518	\N	{}
cfc6da0c-cde6-4b31-acbf-855480b11f77	icons	1770701931046-threat-2.svg	\N	2026-02-10 05:38:51.142722+00	2026-02-10 05:38:51.142722+00	2026-02-10 05:38:51.142722+00	{"eTag": "\\"e1f701f68285032ef823647f308e10f4\\"", "size": 685, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:52.000Z", "contentLength": 685, "httpStatusCode": 200}	73311822-6113-4878-84d1-2e38b0622d74	\N	{}
ec5b58b2-b8b9-4765-b4fe-ad858b508f84	icons	1770701931189-trophy.svg	\N	2026-02-10 05:38:51.295902+00	2026-02-10 05:38:51.295902+00	2026-02-10 05:38:51.295902+00	{"eTag": "\\"72f2c9f1ed54d8a8606760631ab513ef\\"", "size": 957, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:52.000Z", "contentLength": 957, "httpStatusCode": 200}	6a2f278d-5183-41de-bb95-c527ade3bcd8	\N	{}
661aa98d-c499-4d8c-85fe-d53ce4c43c52	icons	1770768334228-helicopter1.svg	\N	2026-02-11 00:05:34.324171+00	2026-02-11 00:05:34.324171+00	2026-02-11 00:05:34.324171+00	{"eTag": "\\"60bba3949a9aa53ab5910821808aa613\\"", "size": 1145, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:05:35.000Z", "contentLength": 1145, "httpStatusCode": 200}	27af4184-bc44-4379-bdd2-b2e67f0d1ab9	\N	{}
db3c8c60-eef6-4ee6-9d53-298ab25b4b69	icons	1770701931346-virus-wall.svg	\N	2026-02-10 05:38:51.425996+00	2026-02-10 05:38:51.425996+00	2026-02-10 05:38:51.425996+00	{"eTag": "\\"0c4721240d9850f618bd54aebc86fa7a\\"", "size": 1985, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:52.000Z", "contentLength": 1985, "httpStatusCode": 200}	6b15d7a0-2780-4678-a883-78336443c96f	\N	{}
1f76e02d-f963-47c2-9d9e-1e147783df67	icons	1770701931472-vl-dsk-server.svg	\N	2026-02-10 05:38:51.561954+00	2026-02-10 05:38:51.561954+00	2026-02-10 05:38:51.561954+00	{"eTag": "\\"939c4c0af59d8d7c19610d6849c991c8\\"", "size": 1031, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:52.000Z", "contentLength": 1031, "httpStatusCode": 200}	25ad94d4-a76f-4492-a397-8d78d1cbf0aa	\N	{}
8784ae03-51e5-4189-abac-0b70a17e4f02	icons	1770768334390-helicopter2.svg	\N	2026-02-11 00:05:34.483906+00	2026-02-11 00:05:34.483906+00	2026-02-11 00:05:34.483906+00	{"eTag": "\\"0aa5dd7b748eeb841cb5358571414710\\"", "size": 1091, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:05:35.000Z", "contentLength": 1091, "httpStatusCode": 200}	99a65ea4-eb04-4905-ae03-9decd201d1cb	\N	{}
3fa95041-b655-475a-89d3-a6261f8a610a	icons	1770701931610-wafer.svg	\N	2026-02-10 05:38:51.703916+00	2026-02-10 05:38:51.703916+00	2026-02-10 05:38:51.703916+00	{"eTag": "\\"11e336b2dead8c0e1ff1c64ad9434a4a\\"", "size": 653, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:52.000Z", "contentLength": 653, "httpStatusCode": 200}	ae43d197-b704-4d85-82dd-33210c8b1b8f	\N	{}
91e0c2e6-226a-49ce-a1d0-1ff24d7e243c	icons	1770701931745-web-server.svg	\N	2026-02-10 05:38:51.951347+00	2026-02-10 05:38:51.951347+00	2026-02-10 05:38:51.951347+00	{"eTag": "\\"95af966812e800d6521125ae2bfb4f53\\"", "size": 1082, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T05:38:52.000Z", "contentLength": 1082, "httpStatusCode": 200}	ab1e1261-1b5a-4ef0-9c8b-e7e3e16cf83b	\N	{}
039f070a-9ea4-46c6-888d-2364573f7e7b	icons	1770768334546-home-gateway.svg	\N	2026-02-11 00:05:34.63509+00	2026-02-11 00:05:34.63509+00	2026-02-11 00:05:34.63509+00	{"eTag": "\\"13e4e489ccdd9695cdc2f5179022c05a\\"", "size": 1745, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:05:35.000Z", "contentLength": 1745, "httpStatusCode": 200}	d3e38663-f446-463a-9679-531454c2c246	\N	{}
4a221224-8afd-449e-9819-097c1c6782f1	icons	1770768334709-key2.svg	\N	2026-02-11 00:05:34.77759+00	2026-02-11 00:05:34.77759+00	2026-02-11 00:05:34.77759+00	{"eTag": "\\"e701b591e8e6d69226f4a001a72b921c\\"", "size": 725, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:05:35.000Z", "contentLength": 725, "httpStatusCode": 200}	15499a72-da81-463d-84eb-584faa609b3d	\N	{}
5bb435c6-d3e3-4557-a01a-7325d777f85c	icons	1770768334842-meter.svg	\N	2026-02-11 00:05:34.90771+00	2026-02-11 00:05:34.90771+00	2026-02-11 00:05:34.90771+00	{"eTag": "\\"9b7df93499ca148fdd23cffa48004d6c\\"", "size": 1047, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:05:35.000Z", "contentLength": 1047, "httpStatusCode": 200}	b3861a57-1e0e-4000-9485-fe7bd75ccc75	\N	{}
8e1e14b4-564d-4c6e-be36-e2bb9a8a1930	icons	1770768334971-mri.svg	\N	2026-02-11 00:05:35.068732+00	2026-02-11 00:05:35.068732+00	2026-02-11 00:05:35.068732+00	{"eTag": "\\"feb89c4510f657f5667e8a9691b12244\\"", "size": 924, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:05:36.000Z", "contentLength": 924, "httpStatusCode": 200}	4ca509f6-b552-4402-8ae4-9cfa126ee824	\N	{}
38fe7686-275e-4fe5-a066-24ed193a96ee	icons	1770768378647-passenger-ship.svg	\N	2026-02-11 00:06:18.787088+00	2026-02-11 00:06:18.787088+00	2026-02-11 00:06:18.787088+00	{"eTag": "\\"500ed967f17d9614b5d4ecb28fa38cda\\"", "size": 1565, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T00:06:19.000Z", "contentLength": 1565, "httpStatusCode": 200}	05b183c0-58c8-48dc-b840-351d82930684	\N	{}
71eda9e3-3e4e-4e8b-b078-f0207e979866	icons	1770771811402-bus.svg	\N	2026-02-11 01:03:31.487464+00	2026-02-11 01:03:31.487464+00	2026-02-11 01:03:31.487464+00	{"eTag": "\\"4734c8176938641fd5cf69b00432efed\\"", "size": 734, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:32.000Z", "contentLength": 734, "httpStatusCode": 200}	b8ffee06-2f8c-4d62-96a1-b84fd3b088df	\N	{}
ea71b8b0-d822-4c4b-a989-5668da737c4a	icons	1770771832935-car-ev-front.svg	\N	2026-02-11 01:03:53.071387+00	2026-02-11 01:03:53.071387+00	2026-02-11 01:03:53.071387+00	{"eTag": "\\"2cfb4e331588cc9d836cccbbd0953af5\\"", "size": 1370, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:54.000Z", "contentLength": 1370, "httpStatusCode": 200}	43d37746-3cc7-45ba-81c7-2ff41b5ff275	\N	{}
7ecf8621-7469-4b2c-8246-36e7cb116a25	icons	1770771833213-car-ev.svg	\N	2026-02-11 01:03:53.317329+00	2026-02-11 01:03:53.317329+00	2026-02-11 01:03:53.317329+00	{"eTag": "\\"f01de2232399cc615670accabc535d23\\"", "size": 1179, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:54.000Z", "contentLength": 1179, "httpStatusCode": 200}	99eb5199-3767-4420-849e-67342364b544	\N	{}
ac65b189-b194-41bd-86f5-c868096df878	icons	1770771833389-car-front1.svg	\N	2026-02-11 01:03:53.480486+00	2026-02-11 01:03:53.480486+00	2026-02-11 01:03:53.480486+00	{"eTag": "\\"0f1d869e775dc3732b2f60336a7dc451\\"", "size": 1209, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:54.000Z", "contentLength": 1209, "httpStatusCode": 200}	b36099ca-a476-4f69-ab38-bb376dddaf2f	\N	{}
e7b0cfe5-8f49-4f02-b326-f79dc68331e7	icons	1770771833543-car-front2.svg	\N	2026-02-11 01:03:53.656377+00	2026-02-11 01:03:53.656377+00	2026-02-11 01:03:53.656377+00	{"eTag": "\\"baa7e42f4bd3923707efcde8600571c2\\"", "size": 1559, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:54.000Z", "contentLength": 1559, "httpStatusCode": 200}	28595aa9-eba2-4433-ae3d-efca456fc33b	\N	{}
83a0d174-cde8-4db1-b03d-0656947f780d	icons	1770771833725-car-seat.svg	\N	2026-02-11 01:03:53.822067+00	2026-02-11 01:03:53.822067+00	2026-02-11 01:03:53.822067+00	{"eTag": "\\"d88a4f8f998fb18aa9591530611c6857\\"", "size": 592, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:54.000Z", "contentLength": 592, "httpStatusCode": 200}	69c9ba0c-efd9-4fd8-a7d2-72ee094cbf6a	\N	{}
84e75bd2-3717-461d-9544-ce1044f33a66	icons	1770771833890-car1.svg	\N	2026-02-11 01:03:53.990842+00	2026-02-11 01:03:53.990842+00	2026-02-11 01:03:53.990842+00	{"eTag": "\\"67d01541ae4bd9700103c72a3a782368\\"", "size": 1078, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:54.000Z", "contentLength": 1078, "httpStatusCode": 200}	c2952f79-2a37-4a3d-8c13-19769d728110	\N	{}
5a2e8b4c-2eff-48b0-af2c-373d687343cf	icons	1770771834056-car2.svg	\N	2026-02-11 01:03:54.141649+00	2026-02-11 01:03:54.141649+00	2026-02-11 01:03:54.141649+00	{"eTag": "\\"9d6d2575826dc6ff40eb6551a9fda7a1\\"", "size": 1441, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:03:55.000Z", "contentLength": 1441, "httpStatusCode": 200}	68d9bfe1-4ee1-4896-9072-edd9095be6e2	\N	{}
921f8a6b-3730-4f33-a188-08495ef2b0c6	icons	1770771857636-charging-station.svg	\N	2026-02-11 01:04:17.937643+00	2026-02-11 01:04:17.937643+00	2026-02-11 01:04:17.937643+00	{"eTag": "\\"65a3c63d0449a100f8664888792ebf4e\\"", "size": 1070, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:18.000Z", "contentLength": 1070, "httpStatusCode": 200}	90aa0858-45e0-495a-9d3d-d53b452ff31b	\N	{}
fd579901-ebe1-464a-b567-d51d664c9c96	icons	1770771858053-drive-thru.svg	\N	2026-02-11 01:04:18.152583+00	2026-02-11 01:04:18.152583+00	2026-02-11 01:04:18.152583+00	{"eTag": "\\"4ed3643fe39faa0ed850ffc428e79b84\\"", "size": 1594, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:19.000Z", "contentLength": 1594, "httpStatusCode": 200}	a18ee501-87c4-492d-b733-4650a812e49a	\N	{}
4a41b529-6ac3-4422-bb6e-4bd8b9251e23	icons	1770771858262-electric-charge.svg	\N	2026-02-11 01:04:18.364415+00	2026-02-11 01:04:18.364415+00	2026-02-11 01:04:18.364415+00	{"eTag": "\\"2e2e761f2b1cdcef19a411fff9df374a\\"", "size": 886, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:19.000Z", "contentLength": 886, "httpStatusCode": 200}	ba2a7231-c47e-4ffc-ac19-79b216ffed67	\N	{}
e0bc8c13-3691-4097-87bf-1c0f10ce7eda	icons	1770771858434-engine.svg	\N	2026-02-11 01:04:18.526092+00	2026-02-11 01:04:18.526092+00	2026-02-11 01:04:18.526092+00	{"eTag": "\\"f24380b6cad99136b110f8ac16c77397\\"", "size": 899, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:19.000Z", "contentLength": 899, "httpStatusCode": 200}	23faafeb-a79d-4970-bc59-9d0a14d81933	\N	{}
d35e2892-7f99-40db-8bd0-01e00939e7a5	icons	1770771858593-gas-station.svg	\N	2026-02-11 01:04:18.664394+00	2026-02-11 01:04:18.664394+00	2026-02-11 01:04:18.664394+00	{"eTag": "\\"0978b1e8ff4a365f79042ece9ebe7dfb\\"", "size": 696, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:19.000Z", "contentLength": 696, "httpStatusCode": 200}	70bfe135-d56d-488e-9339-1242a157bb83	\N	{}
6b6e33a8-83ce-486f-ae88-cddf3a609ed7	icons	1770771858726-gauge.svg	\N	2026-02-11 01:04:18.798937+00	2026-02-11 01:04:18.798937+00	2026-02-11 01:04:18.798937+00	{"eTag": "\\"e5612e7b4295bd9e1a0da4947a5fde9c\\"", "size": 977, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:19.000Z", "contentLength": 977, "httpStatusCode": 200}	02ab92a7-cee9-4bd8-9d91-593d6c18e4dc	\N	{}
ae22356d-a762-4a38-8064-f37c4c833dcf	icons	1770771858861-indicator-lamp.svg	\N	2026-02-11 01:04:18.950795+00	2026-02-11 01:04:18.950795+00	2026-02-11 01:04:18.950795+00	{"eTag": "\\"c580842d23e2e87870e18c634158e764\\"", "size": 522, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:19.000Z", "contentLength": 522, "httpStatusCode": 200}	ea9cbae1-ba96-4bc3-8306-4e00862a42e7	\N	{}
70684076-c87c-4761-80dc-c9e3d33ff388	icons	1770771859013-light.svg	\N	2026-02-11 01:04:19.105426+00	2026-02-11 01:04:19.105426+00	2026-02-11 01:04:19.105426+00	{"eTag": "\\"9b866d56797d55d9806eebf6fa724912\\"", "size": 862, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:20.000Z", "contentLength": 862, "httpStatusCode": 200}	0c159df0-5daa-486b-ab4d-7b3784a8202a	\N	{}
446bb681-305e-43a9-adef-dced80a4feb5	icons	1771466227106-gift-box.svg	\N	2026-02-19 01:57:07.238295+00	2026-02-19 01:57:07.238295+00	2026-02-19 01:57:07.238295+00	{"eTag": "\\"b57dc15d10c30c09ad481afc37aa1d1b\\"", "size": 700, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:08.000Z", "contentLength": 700, "httpStatusCode": 200}	509b0202-7904-424c-a939-6dc4f317318c	\N	{}
8dfb4908-1dbc-4cdb-8a03-7b1e002fd1e9	icons	1771466227294-hard-disk.svg	\N	2026-02-19 01:57:07.384739+00	2026-02-19 01:57:07.384739+00	2026-02-19 01:57:07.384739+00	{"eTag": "\\"cff92ec52fbd043b0698cd350b4703ef\\"", "size": 697, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:08.000Z", "contentLength": 697, "httpStatusCode": 200}	16157ee9-c231-49ad-b0b6-ddeb443870db	\N	{}
16023470-988f-4973-a783-47a57dad8701	icons	1771466227427-hub.svg	\N	2026-02-19 01:57:07.538321+00	2026-02-19 01:57:07.538321+00	2026-02-19 01:57:07.538321+00	{"eTag": "\\"bde0d009b01c4e637636ea4e53b8cf1c\\"", "size": 1035, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:08.000Z", "contentLength": 1035, "httpStatusCode": 200}	f3965abd-2d4e-41da-a71d-2d063f71a4f9	\N	{}
4324bae0-5fcf-479f-a177-c7b0d95d2642	icons	1771466227588-ics-report.svg	\N	2026-02-19 01:57:07.681486+00	2026-02-19 01:57:07.681486+00	2026-02-19 01:57:07.681486+00	{"eTag": "\\"d2d733ccc1b5c29509e5f4acff346f7f\\"", "size": 947, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:08.000Z", "contentLength": 947, "httpStatusCode": 200}	4faa515f-5211-4550-8001-bcf410e87598	\N	{}
1a2a5fbc-9a40-41a7-817b-23b744663ffe	icons	1771466227721-infra.svg	\N	2026-02-19 01:57:07.810416+00	2026-02-19 01:57:07.810416+00	2026-02-19 01:57:07.810416+00	{"eTag": "\\"8cfc91cbb85b8a3af1829ff38980536c\\"", "size": 1253, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:08.000Z", "contentLength": 1253, "httpStatusCode": 200}	fc4e40d8-0bb1-4770-b703-181cd7fb8712	\N	{}
94b4697c-8882-4414-bac7-cc24ea10735f	icons	1771466227859-ip-phone.svg	\N	2026-02-19 01:57:07.939284+00	2026-02-19 01:57:07.939284+00	2026-02-19 01:57:07.939284+00	{"eTag": "\\"a312984896ad047a76b52baeadbe035b\\"", "size": 975, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:08.000Z", "contentLength": 975, "httpStatusCode": 200}	302a02cd-5880-40b2-9429-c05efc91f4a0	\N	{}
4b324014-032b-4792-acb5-88e9d45d9417	icons	1771466227980-leaf.svg	\N	2026-02-19 01:57:08.06966+00	2026-02-19 01:57:08.06966+00	2026-02-19 01:57:08.06966+00	{"eTag": "\\"d8d45d4003122ffd42189d659fd563d2\\"", "size": 1200, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:09.000Z", "contentLength": 1200, "httpStatusCode": 200}	1bde7512-1545-4fb5-9ba2-3e023bc3d225	\N	{}
cce1b56e-b546-460d-95f6-96ac55fe3811	icons	1770771877270-motorcycle-front.svg	\N	2026-02-11 01:04:37.404923+00	2026-02-11 01:04:37.404923+00	2026-02-11 01:04:37.404923+00	{"eTag": "\\"27b97e34deaf9907f20cf6b7bf3b37d2\\"", "size": 1120, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:38.000Z", "contentLength": 1120, "httpStatusCode": 200}	cbaf0554-f924-4405-b5af-b222729be35c	\N	{}
db3a4f11-92a1-4217-96ab-514705ea3339	icons	1770771877489-motorcycle.svg	\N	2026-02-11 01:04:37.572397+00	2026-02-11 01:04:37.572397+00	2026-02-11 01:04:37.572397+00	{"eTag": "\\"9c2f069c98b773142bd8b53a24333f87\\"", "size": 1137, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:38.000Z", "contentLength": 1137, "httpStatusCode": 200}	b9418752-1e93-4293-8dab-639f59c5067a	\N	{}
b6a04cc0-96f9-406c-911e-e0b497f4e79a	icons	1770771877631-no-ban.svg	\N	2026-02-11 01:04:37.726475+00	2026-02-11 01:04:37.726475+00	2026-02-11 01:04:37.726475+00	{"eTag": "\\"afcc340ad86532cc0eba4794e024dc71\\"", "size": 535, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:38.000Z", "contentLength": 535, "httpStatusCode": 200}	0f8987c1-21b2-4b36-b031-7570bb90b255	\N	{}
44a77729-625f-475c-ac61-b7e078d9396b	icons	1770771877789-oil.svg	\N	2026-02-11 01:04:37.896249+00	2026-02-11 01:04:37.896249+00	2026-02-11 01:04:37.896249+00	{"eTag": "\\"ec5d712f7d3427de317676f5c568d2cb\\"", "size": 990, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:38.000Z", "contentLength": 990, "httpStatusCode": 200}	84590269-361d-4234-a251-5b1c36104a88	\N	{}
5216e805-0906-4698-bdd9-097005e64149	icons	1770771877955-parking.svg	\N	2026-02-11 01:04:38.120619+00	2026-02-11 01:04:38.120619+00	2026-02-11 01:04:38.120619+00	{"eTag": "\\"c2a42ea045dee1d0b2034fddf1ec3c30\\"", "size": 753, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:39.000Z", "contentLength": 753, "httpStatusCode": 200}	96928c0c-7710-4f2f-beaf-1ff8319de019	\N	{}
308c522f-00df-4097-8f2f-e1eb2013060e	icons	1770771878185-radio.svg	\N	2026-02-11 01:04:38.281326+00	2026-02-11 01:04:38.281326+00	2026-02-11 01:04:38.281326+00	{"eTag": "\\"01c1fa3b3aeb5b71d9a847ac8a3591df\\"", "size": 709, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:39.000Z", "contentLength": 709, "httpStatusCode": 200}	87f92c7c-6568-4770-9b72-ba09eb146a01	\N	{}
890064f6-80e7-40ff-804e-663d099176c5	icons	1770771878340-road.svg	\N	2026-02-11 01:04:38.45971+00	2026-02-11 01:04:38.45971+00	2026-02-11 01:04:38.45971+00	{"eTag": "\\"2a8ffbf373e97fe33a7aa0c80a90acbe\\"", "size": 732, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:04:39.000Z", "contentLength": 732, "httpStatusCode": 200}	10c6ab2e-c962-4927-9ef9-a765b5e275b0	\N	{}
db0565f6-eede-4e06-b456-7fca88e62328	icons	1771466260531-microchip.svg	\N	2026-02-19 01:57:40.677842+00	2026-02-19 01:57:40.677842+00	2026-02-19 01:57:40.677842+00	{"eTag": "\\"08c35f231bac21a61611d6cbb55a2c49\\"", "size": 1639, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:41.000Z", "contentLength": 1639, "httpStatusCode": 200}	282bd027-e8f8-4caa-9ecd-1cdf4b10eb1d	\N	{}
6ec54bc7-2776-42cd-81a5-3a683344e818	icons	1771466260742-modem1.svg	\N	2026-02-19 01:57:40.832916+00	2026-02-19 01:57:40.832916+00	2026-02-19 01:57:40.832916+00	{"eTag": "\\"aeb3ad83840f6f35776ac6f4dc3da945\\"", "size": 1065, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:41.000Z", "contentLength": 1065, "httpStatusCode": 200}	7f3e3a35-9761-4e9e-ae5e-9e8eb93db547	\N	{}
65c97f79-acee-48dc-b589-b4298b4c2eb7	icons	1770771914130-scooter.svg	\N	2026-02-11 01:05:14.257406+00	2026-02-11 01:05:14.257406+00	2026-02-11 01:05:14.257406+00	{"eTag": "\\"d9f98b8641772e5ea06248f46ae1670a\\"", "size": 978, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:05:15.000Z", "contentLength": 978, "httpStatusCode": 200}	2a25b853-ec6b-4712-8737-bff09713d7cb	\N	{}
af210f15-8ec4-43ac-90f9-ab9f90ee46f1	icons	1770771914329-seat-belt.svg	\N	2026-02-11 01:05:14.445047+00	2026-02-11 01:05:14.445047+00	2026-02-11 01:05:14.445047+00	{"eTag": "\\"70c2c1bbdf7cbabb2bf7e78ea553e0be\\"", "size": 828, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:05:15.000Z", "contentLength": 828, "httpStatusCode": 200}	26b9cf67-ba77-4184-b756-035a296c5200	\N	{}
2df1051d-adeb-4eb5-88ac-ed6453f9d864	icons	1770771914512-smart-key.svg	\N	2026-02-11 01:05:14.620675+00	2026-02-11 01:05:14.620675+00	2026-02-11 01:05:14.620675+00	{"eTag": "\\"0f8baaa9a2834c487468ff21d79c258f\\"", "size": 965, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:05:15.000Z", "contentLength": 965, "httpStatusCode": 200}	af155ff6-2f26-4ade-b366-7a1f1c661056	\N	{}
669ca5e1-93b0-4aa3-ba2f-7a61e77e2c5f	icons	1770771914689-stop.svg	\N	2026-02-11 01:05:14.771331+00	2026-02-11 01:05:14.771331+00	2026-02-11 01:05:14.771331+00	{"eTag": "\\"88e85516f248db18d363703fe3423dca\\"", "size": 1462, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:05:15.000Z", "contentLength": 1462, "httpStatusCode": 200}	ffbc9316-fbd3-4171-a0ad-9bc948ea01ac	\N	{}
ddb3e42c-cbb3-427d-a631-9bcfdbf3a609	avatars	avatars/cmkdc777200001251hxs59lzx-1771487406135.png	\N	2026-02-19 07:50:06.309513+00	2026-02-19 07:50:06.309513+00	2026-02-19 07:50:06.309513+00	{"eTag": "\\"a8af6e0b4902188f0b804e7a3338cfb7\\"", "size": 139513, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T07:50:07.000Z", "contentLength": 139513, "httpStatusCode": 200}	eb445900-60d4-4f97-8c1c-4d55c8b6e06e	\N	{}
a1835043-37aa-4180-a52f-10e869badd6e	icons	1770771914836-taxi.svg	\N	2026-02-11 01:05:14.937151+00	2026-02-11 01:05:14.937151+00	2026-02-11 01:05:14.937151+00	{"eTag": "\\"b7ca85f8a520b8b57603cc110959b8db\\"", "size": 1500, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:05:15.000Z", "contentLength": 1500, "httpStatusCode": 200}	a468321f-1653-4093-aed1-b8a0492b6ea1	\N	{}
c920a9f8-0373-43bd-ad5b-ef1779fe7549	icons	1770771914999-temperature.svg	\N	2026-02-11 01:05:15.091241+00	2026-02-11 01:05:15.091241+00	2026-02-11 01:05:15.091241+00	{"eTag": "\\"ad9f533da981364c3bd63b4fd93ed7f5\\"", "size": 1192, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:05:16.000Z", "contentLength": 1192, "httpStatusCode": 200}	c43e647e-77b7-4f89-b3dd-d1bdf40df182	\N	{}
8daa6a74-a852-47ba-8c93-0b61067d401a	icons	1770771915151-traffic-light1.svg	\N	2026-02-11 01:05:15.258564+00	2026-02-11 01:05:15.258564+00	2026-02-11 01:05:15.258564+00	{"eTag": "\\"24303ebdfd5e3c6ab7f4a7d1ca14ff14\\"", "size": 704, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:05:16.000Z", "contentLength": 704, "httpStatusCode": 200}	fde31212-7753-4f98-be53-b3d58b2bbc23	\N	{}
623c29c9-beb9-49e2-b1a8-857aa4a7274f	icons	1770771915327-traffic-light2.svg	\N	2026-02-11 01:05:15.413547+00	2026-02-11 01:05:15.413547+00	2026-02-11 01:05:15.413547+00	{"eTag": "\\"673971de66e5e8198da09b4e1c64fe30\\"", "size": 673, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:05:16.000Z", "contentLength": 673, "httpStatusCode": 200}	52c2bd8a-2297-4fae-8007-91615b30a819	\N	{}
33659ef0-78af-48cf-9980-6f71a04e5bec	icons	1770771915481-traffic-light3.svg	\N	2026-02-11 01:05:15.559055+00	2026-02-11 01:05:15.559055+00	2026-02-11 01:05:15.559055+00	{"eTag": "\\"77df7a8a42e3c13548f26f2d102b44b3\\"", "size": 1062, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-11T01:05:16.000Z", "contentLength": 1062, "httpStatusCode": 200}	f9ab778a-bc52-49a8-8be5-cfbd5df21a8f	\N	{}
f4ae1044-42ba-462b-b135-59b8f6aa593c	ppt-thumbnails	ppt-cmknasqe2000312susqwzr9cf-1775720426826.jpg	\N	2026-04-09 07:40:26.972357+00	2026-04-09 07:40:26.972357+00	2026-04-09 07:40:26.972357+00	{"eTag": "\\"09ae261ab20bce5b1765c21c6798c473\\"", "size": 73737, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T07:40:27.000Z", "contentLength": 73737, "httpStatusCode": 200}	e4a06d61-5ffc-4b74-8819-d329b5cfb3f3	\N	{}
fcbf2f80-8b3a-4e72-a63a-886842498f13	ppt-thumbnails	ppt-cmkgktibl000341t8fmgq5r8a-1775720542198.jpg	\N	2026-04-09 07:42:22.597177+00	2026-04-09 07:42:22.597177+00	2026-04-09 07:42:22.597177+00	{"eTag": "\\"741cb323730fc8ef7e1c8bfe61147d52\\"", "size": 58762, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T07:42:23.000Z", "contentLength": 58762, "httpStatusCode": 200}	8764d937-849e-4a5b-82dc-c6fa39d07326	\N	{}
57024570-72e1-4a52-a0b6-e1aaf559e954	icons	1771466034415-access-point.svg	\N	2026-02-19 01:53:54.849586+00	2026-02-19 01:53:54.849586+00	2026-02-19 01:53:54.849586+00	{"eTag": "\\"278577bc6e94e0aee5f87e5e0730c540\\"", "size": 1004, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:53:55.000Z", "contentLength": 1004, "httpStatusCode": 200}	96aaf168-59bd-44af-ba8e-636a5c1d6b0d	\N	{}
cca999ac-ccee-478a-96ba-588811b60368	icons	1771466035227-appliance.svg	\N	2026-02-19 01:53:55.367496+00	2026-02-19 01:53:55.367496+00	2026-02-19 01:53:55.367496+00	{"eTag": "\\"a60d89767814a6164f842181ff49013a\\"", "size": 558, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:53:56.000Z", "contentLength": 558, "httpStatusCode": 200}	b47a407e-9767-44fb-9dcb-9a942dbe1044	\N	{}
ff1e359c-4692-4407-9f83-8686e768ff68	icons	1771466035581-bar-code.svg	\N	2026-02-19 01:53:55.701084+00	2026-02-19 01:53:55.701084+00	2026-02-19 01:53:55.701084+00	{"eTag": "\\"ce59e8c85b2bf43dd4a2a7e00dd947e7\\"", "size": 1192, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:53:56.000Z", "contentLength": 1192, "httpStatusCode": 200}	467301b4-a8ad-4646-b3ec-5315c910b01a	\N	{}
49805499-2be3-4341-a5ad-83b4f97856b4	icons	1771466035761-box1.svg	\N	2026-02-19 01:53:55.848935+00	2026-02-19 01:53:55.848935+00	2026-02-19 01:53:55.848935+00	{"eTag": "\\"a0ee412a3c7a10e4cd9d9f01bf3acc94\\"", "size": 504, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:53:56.000Z", "contentLength": 504, "httpStatusCode": 200}	55e29f66-dbeb-4128-bf58-75d64eea55a0	\N	{}
4ef7bff4-2b0a-47a6-a40c-cb693a785b19	ppt-thumbnails	ppt-cmknaus6r000512sum48qul85-1775720385445.jpg	\N	2026-04-09 07:39:45.6596+00	2026-04-09 07:39:45.6596+00	2026-04-09 07:39:45.6596+00	{"eTag": "\\"730796ad9387899b56fdf421e0adc54b\\"", "size": 73021, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T07:39:46.000Z", "contentLength": 73021, "httpStatusCode": 200}	e32a0d04-3fde-409b-aa97-d77968128170	\N	{}
e2ae4ffb-01c8-40b2-b31e-fdbb3e991906	icons	1771466035894-box2.svg	\N	2026-02-19 01:53:55.991859+00	2026-02-19 01:53:55.991859+00	2026-02-19 01:53:55.991859+00	{"eTag": "\\"ccd978cab627a6633b51ad2667d125f6\\"", "size": 763, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:53:56.000Z", "contentLength": 763, "httpStatusCode": 200}	4346f350-671d-442e-94bb-50a3f48b7d3c	\N	{}
3039ba83-e805-4040-a207-a382d545502e	icons	1771466036044-building1.svg	\N	2026-02-19 01:53:56.157871+00	2026-02-19 01:53:56.157871+00	2026-02-19 01:53:56.157871+00	{"eTag": "\\"a30c0df87d5412b1f347f2e224c0d1cd\\"", "size": 1179, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:53:57.000Z", "contentLength": 1179, "httpStatusCode": 200}	f83ae63c-1da8-4e81-873e-818ba07a3572	\N	{}
7663d2f1-067d-47e8-b94d-30730a129590	ppt-thumbnails	ppt-cmknaq34e000112sus0avghqq-1775720455239.jpg	\N	2026-04-09 07:40:55.358018+00	2026-04-09 07:40:55.358018+00	2026-04-09 07:40:55.358018+00	{"eTag": "\\"531364c0ee78632d2ac9f6c78bf36580\\"", "size": 77632, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T07:40:56.000Z", "contentLength": 77632, "httpStatusCode": 200}	f7bff2ca-3ca4-4a97-b997-069beed22b34	\N	{}
1ab23a78-1089-4d9c-8c19-46434f38c55a	icons	1771466036204-building2.svg	\N	2026-02-19 01:53:56.328034+00	2026-02-19 01:53:56.328034+00	2026-02-19 01:53:56.328034+00	{"eTag": "\\"6dc3bc897892bd96388a5531c75c5e5e\\"", "size": 1359, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:53:57.000Z", "contentLength": 1359, "httpStatusCode": 200}	7e33366d-0ad4-46dd-a0c0-572dda095739	\N	{}
60eb8634-c1bd-4a57-a8ba-4d0d2b5abdc1	icons	1771466036373-carrier.svg	\N	2026-02-19 01:53:56.468791+00	2026-02-19 01:53:56.468791+00	2026-02-19 01:53:56.468791+00	{"eTag": "\\"f7f22dc77c8aa50a4764e8107cdeb409\\"", "size": 807, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:53:57.000Z", "contentLength": 807, "httpStatusCode": 200}	ae443236-89ab-48f6-880d-5c60dfba2bac	\N	{}
2c8edff0-9237-4ba0-bdf4-a92b5b9cbc07	ppt-thumbnails	ppt-cmkna7rqf00012ht1cjswmpey-1775720481400.jpg	\N	2026-04-09 07:41:21.513593+00	2026-04-09 07:41:21.513593+00	2026-04-09 07:41:21.513593+00	{"eTag": "\\"5966f82ea05acc5fd24402ed13a195c0\\"", "size": 74162, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T07:41:22.000Z", "contentLength": 74162, "httpStatusCode": 200}	6c95dedd-41b9-4c1d-be3c-6c056847fd73	\N	{}
56e6d895-a5bc-47fc-be37-f0ffd880def2	ppt-thumbnails	ppt-cmkn9snmn0003b1ifb4vesqi3-1775720511583.jpg	\N	2026-04-09 07:41:51.930357+00	2026-04-09 07:41:51.930357+00	2026-04-09 07:41:51.930357+00	{"eTag": "\\"f29d081a53da8b8ff118c430854b115d\\"", "size": 75902, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T07:41:52.000Z", "contentLength": 75902, "httpStatusCode": 200}	6137ad07-3344-44ab-97e8-6728b70ac670	\N	{}
2fa0f820-ee34-43da-9f1c-619b11f15d3d	icons	1771466074317-cd.svg	\N	2026-02-19 01:54:34.438942+00	2026-02-19 01:54:34.438942+00	2026-02-19 01:54:34.438942+00	{"eTag": "\\"edea340fad2d2ba08cad98179555f978\\"", "size": 464, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:54:35.000Z", "contentLength": 464, "httpStatusCode": 200}	6eb33280-4c3b-4d83-ac56-2ab15f80644d	\N	{}
745f5dc0-425a-4b3f-a9e6-27270bbc5400	icons	1771466074493-certificate.svg	\N	2026-02-19 01:54:34.61356+00	2026-02-19 01:54:34.61356+00	2026-02-19 01:54:34.61356+00	{"eTag": "\\"bb01bebe20de090f3bc62ad498bc0fed\\"", "size": 867, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:54:35.000Z", "contentLength": 867, "httpStatusCode": 200}	fb51adbd-7a94-4c23-8887-b326e243dfdd	\N	{}
8d207462-b3da-41ab-afaa-e6d463db6a62	icons	1771466074662-certification-center.svg	\N	2026-02-19 01:54:34.748902+00	2026-02-19 01:54:34.748902+00	2026-02-19 01:54:34.748902+00	{"eTag": "\\"342c95e40b832d7a159c569150675143\\"", "size": 761, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:54:35.000Z", "contentLength": 761, "httpStatusCode": 200}	d8ba1c41-a19b-496d-9c15-3af9c3d01dbb	\N	{}
ef331942-7769-4d76-a345-d1d1cb494fc7	icons	1771466074796-certification-institution.svg	\N	2026-02-19 01:54:34.902977+00	2026-02-19 01:54:34.902977+00	2026-02-19 01:54:34.902977+00	{"eTag": "\\"1bc3ea90be7895298ba5bbed037d666c\\"", "size": 1081, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:54:35.000Z", "contentLength": 1081, "httpStatusCode": 200}	e5b0338c-d009-40e8-9005-1ae40b7b63eb	\N	{}
3c066785-fa50-4b24-a3d4-59d655083ba5	icons	1771466074961-certification1.svg	\N	2026-02-19 01:54:35.102891+00	2026-02-19 01:54:35.102891+00	2026-02-19 01:54:35.102891+00	{"eTag": "\\"7d90c989c56302da379aad1bcfc562e9\\"", "size": 778, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:54:36.000Z", "contentLength": 778, "httpStatusCode": 200}	6a4138bd-1de7-43a1-b8ec-d27f5b177d8a	\N	{}
fcca3278-7693-42df-a162-6a0aa8ab8123	ppt-thumbnails	ppt-cmknfeql2000112yt09njl81d-1775722557456.jpg	\N	2026-04-09 08:15:57.582721+00	2026-04-09 08:15:57.582721+00	2026-04-09 08:15:57.582721+00	{"eTag": "\\"a96568379ba259dfa29a6e5049a367f9\\"", "size": 25900, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-09T08:15:58.000Z", "contentLength": 25900, "httpStatusCode": 200}	4cb818df-fc57-46bb-b5b1-99049dab2753	\N	{}
acee63a1-c9f1-467e-b1dd-a94388c15f07	icons	1771466075160-certification2.svg	\N	2026-02-19 01:54:35.254931+00	2026-02-19 01:54:35.254931+00	2026-02-19 01:54:35.254931+00	{"eTag": "\\"e5a6f9619053ad9ab5c6d259e3f7b323\\"", "size": 522, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:54:36.000Z", "contentLength": 522, "httpStatusCode": 200}	00316116-8a00-459c-b36f-f408a5399919	\N	{}
5ca0632a-5e72-4f9b-93fd-80b9dbed61f2	icons	1771466075305-check-list.svg	\N	2026-02-19 01:54:35.398471+00	2026-02-19 01:54:35.398471+00	2026-02-19 01:54:35.398471+00	{"eTag": "\\"70b799beeffbe2a7dabc919641ab5dbb\\"", "size": 729, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:54:36.000Z", "contentLength": 729, "httpStatusCode": 200}	c9dea499-72b5-45a4-aa58-b03ab23320b5	\N	{}
8a6dbc86-c175-48a7-948f-bfcf704aa633	icons	1771466075446-consulting.svg	\N	2026-02-19 01:54:35.561728+00	2026-02-19 01:54:35.561728+00	2026-02-19 01:54:35.561728+00	{"eTag": "\\"c41bc75b090fe959f9f41095e7fa32b6\\"", "size": 901, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:54:36.000Z", "contentLength": 901, "httpStatusCode": 200}	96ebdc22-3823-4234-b672-32b4fed1b27b	\N	{}
a2220b2f-048b-431a-a899-f39779c8ac8a	icons	1771466143362-db-table.svg	\N	2026-02-19 01:55:43.82862+00	2026-02-19 01:55:43.82862+00	2026-02-19 01:55:43.82862+00	{"eTag": "\\"8b9746d61a09d41dbe12f997b5e4e358\\"", "size": 1504, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:55:44.000Z", "contentLength": 1504, "httpStatusCode": 200}	fc965653-b40b-4977-bae2-f606e426feb0	\N	{}
3157227b-4e6f-4bfc-aaad-146d80a6bc9c	icons	1771466143889-dcu.svg	\N	2026-02-19 01:55:43.97748+00	2026-02-19 01:55:43.97748+00	2026-02-19 01:55:43.97748+00	{"eTag": "\\"e0acd919e26160e96f8eb8deed16f477\\"", "size": 1116, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:55:44.000Z", "contentLength": 1116, "httpStatusCode": 200}	07839ffc-727e-4d2a-acea-55808f81a23a	\N	{}
1ba55c1c-6ab8-4d86-82e6-133fd59ecd13	icons	1771466144020-documentation2.svg	\N	2026-02-19 01:55:44.118219+00	2026-02-19 01:55:44.118219+00	2026-02-19 01:55:44.118219+00	{"eTag": "\\"46e1c4e2a2da2d8862cfefaef1383bf4\\"", "size": 901, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:55:45.000Z", "contentLength": 901, "httpStatusCode": 200}	74161932-7f20-4209-b506-5fe6504865d9	\N	{}
a227c9a7-1163-4f39-a2a5-9650d95e451c	icons	1771466144161-electric.svg	\N	2026-02-19 01:55:44.237004+00	2026-02-19 01:55:44.237004+00	2026-02-19 01:55:44.237004+00	{"eTag": "\\"e8579dd7a112fdd2d9e146af86385364\\"", "size": 453, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:55:45.000Z", "contentLength": 453, "httpStatusCode": 200}	21c84713-12c8-47ec-b8a8-54b9661d1370	\N	{}
3267dee9-5e08-4bf3-8690-0e07418627da	icons	1771466144279-encryption-table.svg	\N	2026-02-19 01:55:44.367822+00	2026-02-19 01:55:44.367822+00	2026-02-19 01:55:44.367822+00	{"eTag": "\\"8927181de63c6d186a38117493c3c05d\\"", "size": 1162, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:55:45.000Z", "contentLength": 1162, "httpStatusCode": 200}	d45da345-318d-4f0e-8953-8d534e7c168c	\N	{}
49d2baf0-147b-4349-804c-60b8bb431b42	icons	1771466144588-file.svg	\N	2026-02-19 01:55:44.704448+00	2026-02-19 01:55:44.704448+00	2026-02-19 01:55:44.704448+00	{"eTag": "\\"655d05163176bbb00d5ae7ab42e6c87f\\"", "size": 672, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:55:45.000Z", "contentLength": 672, "httpStatusCode": 200}	61e53d46-0a79-4dfe-8903-796d1eb2a4b3	\N	{}
b43bb6b0-068e-41b3-8d0c-102be0cc1b29	icons	1771466144760-first.svg	\N	2026-02-19 01:55:45.40104+00	2026-02-19 01:55:45.40104+00	2026-02-19 01:55:45.40104+00	{"eTag": "\\"d431188f035625c7edd91db7605a982a\\"", "size": 653, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:55:46.000Z", "contentLength": 653, "httpStatusCode": 200}	8cc926df-b3e5-4615-be49-e152402fb413	\N	{}
23bad9bf-c95a-4377-b4a2-ed568343c538	icons	1771466228125-lighthouse.svg	\N	2026-02-19 01:57:08.24118+00	2026-02-19 01:57:08.24118+00	2026-02-19 01:57:08.24118+00	{"eTag": "\\"645a1035056856f96f21db9e605d11bc\\"", "size": 875, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:09.000Z", "contentLength": 875, "httpStatusCode": 200}	2b77d875-6f99-4904-83f5-cce9f0cac51d	\N	{}
a810a818-3b59-4deb-b49b-5cc4d3474051	icons	1771466228295-log.svg	\N	2026-02-19 01:57:08.373441+00	2026-02-19 01:57:08.373441+00	2026-02-19 01:57:08.373441+00	{"eTag": "\\"103447bdd8166f151e2aabe89707dd22\\"", "size": 1308, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:09.000Z", "contentLength": 1308, "httpStatusCode": 200}	65c4522f-2b11-40b5-905f-da82ed232db2	\N	{}
5155089f-9123-469f-a838-b983c26d0583	icons	1771466260890-modem2.svg	\N	2026-02-19 01:57:40.984595+00	2026-02-19 01:57:40.984595+00	2026-02-19 01:57:40.984595+00	{"eTag": "\\"4a1798dcf3209b30c0ac78dfb5b9deb1\\"", "size": 1254, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:41.000Z", "contentLength": 1254, "httpStatusCode": 200}	7a21af89-8a37-4416-91a9-fbf5bbd2590f	\N	{}
fef55358-25ef-4e42-9431-d1cab6d4e270	icons	1771466261035-nfc.svg	\N	2026-02-19 01:57:41.121826+00	2026-02-19 01:57:41.121826+00	2026-02-19 01:57:41.121826+00	{"eTag": "\\"e9e77396b3b46d36a1a7af992205470c\\"", "size": 583, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:42.000Z", "contentLength": 583, "httpStatusCode": 200}	0ac83099-ecdc-475b-b339-ef99ed93ec86	\N	{}
9ef243f7-c641-4b28-a868-3061ec842fad	icons	1771466261168-printer.svg	\N	2026-02-19 01:57:41.295479+00	2026-02-19 01:57:41.295479+00	2026-02-19 01:57:41.295479+00	{"eTag": "\\"16eff7974f1cd2b4b932966bd29f229f\\"", "size": 823, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:42.000Z", "contentLength": 823, "httpStatusCode": 200}	07bd1f00-8163-409b-8241-7d7892acc7ad	\N	{}
3f9502de-2b03-4491-a116-5daac090dfad	icons	1771466261357-radio-tower.svg	\N	2026-02-19 01:57:41.452567+00	2026-02-19 01:57:41.452567+00	2026-02-19 01:57:41.452567+00	{"eTag": "\\"2fa7e3eecdb2f387d6b3ec43e5adfe33\\"", "size": 917, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:42.000Z", "contentLength": 917, "httpStatusCode": 200}	1e3d9e3b-1408-4457-bf96-9c3fec3ebc45	\N	{}
a44d8e17-f98d-4f4b-937c-7b4ef6618a79	icons	1771466261505-remote-access.svg	\N	2026-02-19 01:57:41.608494+00	2026-02-19 01:57:41.608494+00	2026-02-19 01:57:41.608494+00	{"eTag": "\\"416e91e941f4df4e43e6826ca98adf2a\\"", "size": 1156, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:42.000Z", "contentLength": 1156, "httpStatusCode": 200}	9e212935-1c96-4297-88ea-443d6be09b31	\N	{}
7e930fa6-ca91-4ae3-9e00-52c4bd840c6f	icons	1771466261662-router.svg	\N	2026-02-19 01:57:41.744801+00	2026-02-19 01:57:41.744801+00	2026-02-19 01:57:41.744801+00	{"eTag": "\\"50582b1e536d65d977d3b9774891e64c\\"", "size": 994, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:57:42.000Z", "contentLength": 994, "httpStatusCode": 200}	b62d252e-85b0-46bb-82b8-3fd49b152135	\N	{}
9d898f66-7b7a-4516-a0d0-4c5214d8114f	icons	1771466281555-satellite.svg	\N	2026-02-19 01:58:01.721613+00	2026-02-19 01:58:01.721613+00	2026-02-19 01:58:01.721613+00	{"eTag": "\\"24b599d1c2a79114386c1994d56364b1\\"", "size": 1284, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:58:02.000Z", "contentLength": 1284, "httpStatusCode": 200}	d1d67ff1-bd23-43f4-b825-9232af88d2ed	\N	{}
4df89d10-dd56-4325-bfa0-29a328bc86a4	icons	1771466281796-scanner.svg	\N	2026-02-19 01:58:01.961231+00	2026-02-19 01:58:01.961231+00	2026-02-19 01:58:01.961231+00	{"eTag": "\\"c7efc2f42516b96bf74bc48f18d1a917\\"", "size": 593, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:58:02.000Z", "contentLength": 593, "httpStatusCode": 200}	8569fc3c-b2a9-4e24-a3ae-ad198254ce4c	\N	{}
238bc88a-db43-4e94-a986-72d9566e0d04	icons	1771466282067-ssl.svg	\N	2026-02-19 01:58:03.682022+00	2026-02-19 01:58:03.682022+00	2026-02-19 01:58:03.682022+00	{"eTag": "\\"bea3b789c713efea56e5749da60a11bd\\"", "size": 691, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:58:04.000Z", "contentLength": 691, "httpStatusCode": 200}	ada25018-2a1f-449f-9d8e-4c63055bd0da	\N	{}
116b0b76-5c67-4b4b-93e9-ae88ab98b4f4	icons	1771466283736-table.svg	\N	2026-02-19 01:58:03.839365+00	2026-02-19 01:58:03.839365+00	2026-02-19 01:58:03.839365+00	{"eTag": "\\"653e68b0c260e7b846939fcaa0d9d4d5\\"", "size": 763, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:58:04.000Z", "contentLength": 763, "httpStatusCode": 200}	2475fea6-1030-4907-950e-2db30dc36689	\N	{}
adb7324c-8a0e-4d84-8346-c637485debaa	icons	1771466283886-transmission-tower.svg	\N	2026-02-19 01:58:04.002741+00	2026-02-19 01:58:04.002741+00	2026-02-19 01:58:04.002741+00	{"eTag": "\\"736ff402b512d8b07d001fef4172ad83\\"", "size": 1395, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:58:04.000Z", "contentLength": 1395, "httpStatusCode": 200}	581d3a04-808f-49a2-9220-627a30d36379	\N	{}
c8416af7-3770-48bb-ba4b-5385a0a1e782	icons	1771466284061-valve.svg	\N	2026-02-19 01:58:04.171879+00	2026-02-19 01:58:04.171879+00	2026-02-19 01:58:04.171879+00	{"eTag": "\\"f7231f4ac73c4f5ae22337a2a1955304\\"", "size": 911, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:58:05.000Z", "contentLength": 911, "httpStatusCode": 200}	2d1ec7c5-18fc-489e-a38f-b3cefff824c1	\N	{}
aea67525-f464-43ba-ae87-1a0d4665bdbc	icons	1771466284230-vpn.svg	\N	2026-02-19 01:58:04.344986+00	2026-02-19 01:58:04.344986+00	2026-02-19 01:58:04.344986+00	{"eTag": "\\"6a5aa0f275435e66dff89a3e16d0db4f\\"", "size": 1081, "mimetype": "image/svg+xml", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T01:58:05.000Z", "contentLength": 1081, "httpStatusCode": 200}	f0d7d4b4-fe13-41c2-9d26-13c76a08291a	\N	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: design5
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: design5
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: design5
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: design5
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: design5
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: card_templates card_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.card_templates
    ADD CONSTRAINT card_templates_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: design_requests design_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.design_requests
    ADD CONSTRAINT design_requests_pkey PRIMARY KEY (id);


--
-- Name: desktop_wallpapers desktop_wallpapers_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.desktop_wallpapers
    ADD CONSTRAINT desktop_wallpapers_pkey PRIMARY KEY (id);


--
-- Name: diagram_zip_config diagram_zip_config_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.diagram_zip_config
    ADD CONSTRAINT diagram_zip_config_pkey PRIMARY KEY (id);


--
-- Name: diagrams diagrams_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.diagrams
    ADD CONSTRAINT diagrams_pkey PRIMARY KEY (id);


--
-- Name: edms edms_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.edms
    ADD CONSTRAINT edms_pkey PRIMARY KEY (id);


--
-- Name: notices notices_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);


--
-- Name: post_tags post_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.post_tags
    ADD CONSTRAINT post_tags_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: welcomeboard_templates welcomeboard_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.welcomeboard_templates
    ADD CONSTRAINT welcomeboard_templates_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: design5
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: design5
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: design5
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: design5
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: design5
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: design5
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: design5
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: design_requests_authorId_idx; Type: INDEX; Schema: public; Owner: design5
--

CREATE INDEX "design_requests_authorId_idx" ON public.design_requests USING btree ("authorId");


--
-- Name: design_requests_createdAt_idx; Type: INDEX; Schema: public; Owner: design5
--

CREATE INDEX "design_requests_createdAt_idx" ON public.design_requests USING btree ("createdAt");


--
-- Name: design_requests_dueDate_idx; Type: INDEX; Schema: public; Owner: design5
--

CREATE INDEX "design_requests_dueDate_idx" ON public.design_requests USING btree ("dueDate");


--
-- Name: design_requests_status_idx; Type: INDEX; Schema: public; Owner: design5
--

CREATE INDEX design_requests_status_idx ON public.design_requests USING btree (status);


--
-- Name: diagram_zip_config_key_key; Type: INDEX; Schema: public; Owner: design5
--

CREATE UNIQUE INDEX diagram_zip_config_key_key ON public.diagram_zip_config USING btree (key);


--
-- Name: post_tags_postId_tagId_key; Type: INDEX; Schema: public; Owner: design5
--

CREATE UNIQUE INDEX "post_tags_postId_tagId_key" ON public.post_tags USING btree ("postId", "tagId");


--
-- Name: posts_categoryId_idx; Type: INDEX; Schema: public; Owner: design5
--

CREATE INDEX "posts_categoryId_idx" ON public.posts USING btree ("categoryId");


--
-- Name: posts_createdAt_idx; Type: INDEX; Schema: public; Owner: design5
--

CREATE INDEX "posts_createdAt_idx" ON public.posts USING btree ("createdAt");


--
-- Name: posts_status_idx; Type: INDEX; Schema: public; Owner: design5
--

CREATE INDEX posts_status_idx ON public.posts USING btree (status);


--
-- Name: tags_name_key; Type: INDEX; Schema: public; Owner: design5
--

CREATE UNIQUE INDEX tags_name_key ON public.tags USING btree (name);


--
-- Name: tags_slug_key; Type: INDEX; Schema: public; Owner: design5
--

CREATE UNIQUE INDEX tags_slug_key ON public.tags USING btree (slug);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: design5
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: design5
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: design5
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: design5
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: design5
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: design5
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: design5
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: design5
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: design5
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: design5
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: design5
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: design5
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: design5
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: design5
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: design5
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: design5
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: design5
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: design5
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: card_templates card_templates_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.card_templates
    ADD CONSTRAINT "card_templates_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: design_requests design_requests_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.design_requests
    ADD CONSTRAINT "design_requests_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: desktop_wallpapers desktop_wallpapers_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.desktop_wallpapers
    ADD CONSTRAINT "desktop_wallpapers_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: diagrams diagrams_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.diagrams
    ADD CONSTRAINT "diagrams_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: edms edms_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.edms
    ADD CONSTRAINT "edms_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notices notices_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT "notices_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: post_tags post_tags_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.post_tags
    ADD CONSTRAINT "post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_tags post_tags_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.post_tags
    ADD CONSTRAINT "post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: posts posts_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: posts posts_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: welcomeboard_templates welcomeboard_templates_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: design5
--

ALTER TABLE ONLY public.welcomeboard_templates
    ADD CONSTRAINT "welcomeboard_templates_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: design5
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: design5
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: design5
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: design5
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: design5
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: design5
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: design5
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: design5
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: design5
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: design5
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: design5
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: design5
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO design5;

--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: design5
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO design5;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: design5
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO design5;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: design5
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO design5;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: design5
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO design5;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: design5
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO design5;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: design5
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO design5;

--
-- PostgreSQL database dump complete
--

\unrestrict gnkFpvC6eESGctE2jAVasAQeDMI2IYclM8lbdSycaGOeCnM8T6J2JPsHwb0ifK4

