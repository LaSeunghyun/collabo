# 스테이징 데이터 스냅샷 가이드

Phase 0에서 정의한 "스테이징 데이터 확보" 작업을 실행하려면 아래 절차를 따르세요.

## 1. 덤프 생성
1. 스테이징 데이터베이스에 읽기 전용 계정으로 접속합니다.
2. 다음 명령으로 최신 스냅샷을 추출합니다.
   ```bash
   pg_dump \
     --format=custom \
     --compress=6 \
     --no-owner \
     --dbname="$STAGING_DATABASE_URL" \
     --file=baselines/staging-latest.dump
   ```
3. 덤프 파일에는 PII가 포함될 수 있으므로, 로컬에 저장하기 전에 안전한 스토리지(S3 secure bucket)에 업로드하고 접근 권한을 제한합니다.

## 2. 민감 정보 마스킹
1. `scripts/mask-staging-dump.sql` (작성 예정) 또는 수동 SQL을 사용하여 다음 항목을 마스킹합니다.
   - 사용자 이메일, 전화번호, 소셜 계정 ID
   - 결제 관련 토큰 및 Stripe customer ID
   - 주소, 계좌번호 등 개인정보
2. 마스킹 규칙은 `docs/privacy/masking-policy.md`가 준비되기 전까지 아래 표준을 사용합니다.
   | 컬럼 | 변환 규칙 |
   | --- | --- |
   | email | `concat('user+', id, '@example.com')` |
   | phone | `NULL` |
   | address | `NULL` |
   | external_account_id | `md5(external_account_id)` |

## 3. 메타데이터 업데이트
- 덤프가 완료되면 이 문서 상단에 다음 정보를 추가합니다.
  - 생성 일시 (UTC)
  - 담당자
  - 원본 스키마 버전 (`docs/baselines/prisma-schema-baseline.sql` SHA)
- 변경 이력은 아래 표에 누적합니다.

| 생성 일시 (UTC) | 담당자 | 비고 |
| --- | --- | --- |

## 4. 활용 가이드
- QA: 회귀 테스트 시 seed로 사용하기 전에 민감 정보를 다시 한번 확인합니다.
- 개발: 로컬 복원 시 `pg_restore --clean --if-exists --dbname=$LOCAL_DATABASE_URL baselines/staging-latest.dump` 명령을 사용합니다.
- DevOps: 덤프 파일을 90일간 보존하고 이후 폐기합니다.

> ⚠️ 현재 스냅샷은 아직 생성되지 않았습니다. 위 절차를 따라 첫 덤프를 수집하고, 테이블 하단에 기록을 남겨주세요.
