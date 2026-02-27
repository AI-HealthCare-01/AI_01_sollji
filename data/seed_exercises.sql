-- @formatter:off
INSERT INTO exercise_library (
    exercise_id, exercise_name, category, difficulty_level,
    contraindications, instructions, video_url, tags, created_at
) VALUES
(
    'knee01', '쿼드세팅 (Quad Setting)', '무릎', 'low',
    ARRAY[]::TEXT[],
    '1. 바닥이나 침대에 다리를 펴고 눕습니다.
2. 무릎 뒤쪽을 바닥에 꾹 눌러 허벅지 앞쪽 근육에 힘을 줍니다.
3. 10초간 유지합니다.
4. 천천히 힘을 풉니다.
5. 10회 반복 후 반대쪽도 실시합니다.
통증 발생 시 즉시 중단하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee01',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'knee02', 'SLR (Straight Leg Raise)', '무릎', 'low',
    ARRAY['급성 허리 통증'],
    '1. 바닥에 똑바로 눕습니다.
2. 한쪽 무릎은 세우고 반대쪽 다리는 쭉 펩니다.
3. 발끝을 몸쪽으로 당기며 다리를 45도까지 천천히 들어올립니다.
4. 5초간 유지합니다.
5. 천천히 내리고 10회 반복합니다.
허리가 바닥에서 뜨지 않도록 주의하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee02',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'knee03', '발목 펌핑 (Ankle Pumping)', '무릎', 'low',
    ARRAY[]::TEXT[],
    '1. 의자에 앉거나 누운 자세를 취합니다.
2. 발목을 위아래로 천천히 움직입니다.
3. 발끝을 몸쪽으로 당겼다가 아래로 밀어냅니다.
4. 1초에 1회 속도로 20회 반복합니다.
5. 혈액순환 개선에 도움이 됩니다.
발목 통증이 있으면 중단하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee03',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'knee04', '앉아서 무릎 펴기 (Seated Knee Extension)', '무릎', 'low',
    ARRAY['슬개골 연골 손상'],
    '1. 의자에 허리를 곧게 펴고 앉습니다.
2. 한쪽 다리를 천천히 앞으로 쭉 펩니다.
3. 허벅지 앞쪽 근육에 힘이 들어가는 것을 느낍니다.
4. 5초 유지 후 천천히 내립니다.
5. 양쪽 각 10회 반복합니다.
무릎을 완전히 펼 때 통증이 있으면 범위를 줄이세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee04',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'knee05', '미니 스쿼트 (Mini Squat)', '무릎', 'medium',
    ARRAY['골다공증 심화', '급성 무릎 통증'],
    '1. 발을 어깨 너비로 벌리고 섭니다.
2. 의자나 벽을 가볍게 잡아 균형을 잡습니다.
3. 무릎을 30도 정도만 살짝 구부립니다.
4. 무릎이 발끝을 넘지 않도록 주의합니다.
5. 천천히 일어서서 10회 반복합니다.
낙상 위험이 있으므로 반드시 지지대를 잡고 실시하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee05',
    ARRAY['diabetes_safe', 'hypertension_safe'],
    NOW()
),
(
    'knee06', '스텝 업 (Step Up)', '무릎', 'medium',
    ARRAY['골다공증', '심한 무릎 통증', '균형 장애'],
    '1. 낮은 계단(10~15cm) 앞에 섭니다.
2. 난간을 잡고 한쪽 발로 계단을 올라섭니다.
3. 반대쪽 발을 들어 올려 계단 위에 모읍니다.
4. 천천히 내려옵니다.
5. 양쪽 각 8회 반복합니다.
골다공증 환자는 낙상 위험으로 제외합니다.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee06',
    ARRAY['diabetes_safe', 'hypertension_safe'],
    NOW()
),
(
    'knee07', '옆으로 다리 들기 (Side Lying Hip Abduction)', '무릎', 'low',
    ARRAY[]::TEXT[],
    '1. 옆으로 눕습니다.
2. 아래쪽 무릎은 살짝 구부려 안정감을 줍니다.
3. 위쪽 다리를 발끝이 천장을 향하도록 30도 들어올립니다.
4. 3초 유지 후 천천히 내립니다.
5. 10회 반복 후 반대쪽도 실시합니다.
허리가 뒤로 젖혀지지 않도록 복부에 힘을 주세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee07',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'knee08', '무릎 굽히기 (Prone Knee Flexion)', '무릎', 'medium',
    ARRAY['급성 무릎 통증', '슬개골 골절 후 4주 이내'],
    '1. 엎드려 눕습니다.
2. 한쪽 무릎을 천천히 구부려 발뒤꿈치를 엉덩이 쪽으로 당깁니다.
3. 통증 없는 범위까지만 구부립니다.
4. 3초 유지 후 천천히 내립니다.
5. 10회 반복합니다.
통증이 느껴지는 범위를 넘어서 억지로 구부리지 마세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee08',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'knee09', '터미널 무릎 신전 (Terminal Knee Extension)', '무릎', 'medium',
    ARRAY['슬개골 연골 손상 심화'],
    '1. 벽 앞에 서서 무릎 뒤에 수건을 접어 받칩니다.
2. 수건을 무릎으로 눌러 무릎을 완전히 펍니다.
3. 허벅지 안쪽 근육에 힘이 들어가는 것을 느낍니다.
4. 5초 유지 후 천천히 이완합니다.
5. 15회 반복합니다.
벽에 기대어 균형을 잡고 실시하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee09',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'knee10', '레그 프레스 (Leg Press - 저강도)', '무릎', 'high',
    ARRAY['골다공증', '고혈압 조절 불량', '수술 후 6주 이내'],
    '1. 레그 프레스 기구에 앉아 발을 어깨 너비로 놓습니다.
2. 무릎을 90도로 구부린 상태에서 시작합니다.
3. 발로 플레이트를 밀어 무릎을 천천히 펍니다.
4. 완전히 펴지 않고 10도 남기고 멈춥니다.
5. 천천히 돌아와 10회 반복합니다.
숨을 참지 마세요. 고혈압 환자는 의사 상담 후 실시하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_knee10',
    ARRAY['diabetes_safe'],
    NOW()
),
(
    'back01', '무릎 가슴 당기기 (Knee to Chest Stretch)', '허리', 'low',
    ARRAY[]::TEXT[],
    '1. 바닥에 똑바로 눕습니다.
2. 한쪽 무릎을 양손으로 잡아 가슴 쪽으로 천천히 당깁니다.
3. 허리가 바닥에 닿는 느낌이 들 때까지 당깁니다.
4. 20~30초 유지합니다.
5. 양쪽 각 3회 반복합니다.
당기는 힘이 너무 강하지 않도록 주의하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_back01',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'back02', '골반 기울이기 (Pelvic Tilt)', '허리', 'low',
    ARRAY[]::TEXT[],
    '1. 바닥에 무릎을 세우고 눕습니다.
2. 복부에 힘을 주어 허리를 바닥에 납작하게 붙입니다.
3. 10초간 유지합니다.
4. 천천히 이완합니다.
5. 10회 반복합니다.
숨을 참지 말고 자연스럽게 호흡하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_back02',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'back03', '브릿지 운동 (Glute Bridge)', '허리', 'low',
    ARRAY['급성 허리 디스크'],
    '1. 바닥에 무릎을 세우고 눕습니다.
2. 발을 엉덩이 너비로 벌립니다.
3. 복부와 엉덩이에 힘을 주며 엉덩이를 들어올립니다.
4. 어깨-엉덩이-무릎이 일직선이 되도록 합니다.
5. 5초 유지 후 천천히 내리고 10회 반복합니다.
허리를 과도하게 젖히지 마세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_back03',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'back04', '고양이-낙타 스트레칭 (Cat-Camel Stretch)', '허리', 'low',
    ARRAY['골다공증 심화'],
    '1. 네발 기기 자세를 취합니다.
2. 숨을 내쉬며 등을 천장 쪽으로 둥글게 말아올립니다.
3. 5초 유지합니다.
4. 숨을 들이쉬며 배를 바닥 쪽으로 내리고 고개를 듭니다.
5. 5초 유지 후 10회 반복합니다.
골다공증 환자는 척추 굴곡 동작을 피하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_back04',
    ARRAY['diabetes_safe', 'hypertension_safe'],
    NOW()
),
(
    'back05', '버드독 (Bird Dog)', '허리', 'medium',
    ARRAY['급성 허리 통증', '골다공증 심화'],
    '1. 네발 기기 자세를 취합니다.
2. 복부에 힘을 주어 허리를 중립 자세로 유지합니다.
3. 오른팔과 왼쪽 다리를 동시에 수평으로 뻗습니다.
4. 5초 유지 후 천천히 내립니다.
5. 반대쪽도 실시하고 양쪽 각 8회 반복합니다.
허리가 흔들리지 않도록 코어에 힘을 유지하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_back05',
    ARRAY['diabetes_safe', 'hypertension_safe'],
    NOW()
),
(
    'back06', '슈퍼맨 자세 (Superman)', '허리', 'medium',
    ARRAY['골다공증', '척추관 협착증', '급성 허리 통증'],
    '1. 엎드려 팔을 앞으로 뻗습니다.
2. 복부에 힘을 주고 오른팔과 왼쪽 다리를 동시에 들어올립니다.
3. 3초 유지 후 천천히 내립니다.
4. 반대쪽도 실시합니다.
5. 양쪽 각 8회 반복합니다.
목을 과도하게 젖히지 마세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_back06',
    ARRAY['diabetes_safe', 'hypertension_safe'],
    NOW()
),
(
    'back07', '앉아서 허리 돌리기 (Seated Trunk Rotation)', '허리', 'low',
    ARRAY['척추 수술 후 6주 이내'],
    '1. 의자에 허리를 곧게 펴고 앉습니다.
2. 팔짱을 끼거나 양손을 어깨에 올립니다.
3. 천천히 상체를 오른쪽으로 돌립니다.
4. 10초 유지 후 반대쪽으로 돌립니다.
5. 양쪽 각 5회 반복합니다.
통증 없는 범위에서만 회전하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_back07',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'back08', '맥켄지 신전 운동 (McKenzie Extension)', '허리', 'medium',
    ARRAY['척추관 협착증', '골다공증 심화'],
    '1. 엎드려 양손을 어깨 옆에 놓습니다.
2. 팔꿈치를 펴며 상체를 천천히 들어올립니다.
3. 허리 아래쪽이 늘어나는 느낌을 확인합니다.
4. 10초 유지 후 천천히 내립니다.
5. 10회 반복합니다.
다리 쪽으로 저림이나 통증이 생기면 즉시 중단하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_back08',
    ARRAY['diabetes_safe', 'hypertension_safe'],
    NOW()
),
(
    'back09', '데드버그 (Dead Bug)', '허리', 'medium',
    ARRAY['급성 허리 통증'],
    '1. 바닥에 눕고 팔을 천장 쪽으로 뻗습니다.
2. 무릎을 90도로 들어올립니다.
3. 오른팔과 왼쪽 다리를 동시에 바닥 쪽으로 천천히 뻗습니다.
4. 허리가 바닥에서 뜨지 않도록 복부에 힘을 유지합니다.
5. 원위치 후 반대쪽 실시, 양쪽 각 8회 반복합니다.
허리가 바닥에서 떨어지면 동작 범위를 줄이세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_back09',
    ARRAY['diabetes_safe', 'hypertension_safe'],
    NOW()
),
(
    'back10', '플랭크 (Plank)', '허리', 'high',
    ARRAY['골다공증', '고혈압 조절 불량', '어깨 통증', '손목 통증'],
    '1. 팔꿈치를 바닥에 짚고 엎드립니다.
2. 발끝을 세우고 몸을 일직선으로 들어올립니다.
3. 복부, 엉덩이에 힘을 주어 자세를 유지합니다.
4. 20~30초 유지합니다.
5. 3세트 반복합니다.
숨을 참지 마세요. 고혈압 환자는 혈압 상승 위험이 있어 제외합니다.',
    'https://youtube.com/watch?v=PLACEHOLDER_back10',
    ARRAY['diabetes_safe'],
    NOW()
),
(
    'shoulder01', '진자 운동 (Pendulum Exercise)', '어깨', 'low',
    ARRAY[]::TEXT[],
    '1. 테이블에 한 손을 짚고 앞으로 기울어 섭니다.
2. 반대쪽 팔을 자연스럽게 늘어뜨립니다.
3. 몸을 살짝 흔들어 팔이 시계 방향으로 원을 그리도록 합니다.
4. 반시계 방향으로도 실시합니다.
5. 각 방향 10회 반복합니다.
팔에 힘을 주지 말고 중력에 의해 자연스럽게 움직이게 하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_shoulder01',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'shoulder02', '어깨 으쓱하기 (Shoulder Shrug)', '어깨', 'low',
    ARRAY[]::TEXT[],
    '1. 의자에 앉거나 서서 팔을 자연스럽게 내립니다.
2. 양쪽 어깨를 귀 쪽으로 천천히 으쓱 올립니다.
3. 3초 유지합니다.
4. 천천히 내립니다.
5. 10회 반복합니다.
목을 과도하게 긴장시키지 마세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_shoulder02',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'shoulder03', '벽 기어오르기 (Wall Climbing)', '어깨', 'medium',
    ARRAY['어깨 수술 후 4주 이내', '회전근개 완전 파열'],
    '1. 벽 앞에 서서 손가락을 벽에 댑니다.
2. 손가락으로 벽을 타고 천천히 위로 올라갑니다.
3. 통증 없는 최대 높이에서 멈춥니다.
4. 10초 유지 후 천천히 내립니다.
5. 10회 반복합니다.
통증이 생기는 높이에서 멈추고 억지로 올리지 마세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_shoulder03',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'shoulder04', '어깨 외회전 운동 (External Rotation with Band)', '어깨', 'medium',
    ARRAY['어깨 수술 후 6주 이내'],
    '1. 팔꿈치를 90도로 구부리고 몸통에 붙입니다.
2. 탄성 밴드를 손에 쥐고 고정점에 연결합니다.
3. 팔꿈치를 몸에 고정한 채 손을 바깥쪽으로 돌립니다.
4. 3초 유지 후 천천히 돌아옵니다.
5. 10회 반복합니다.
팔꿈치가 몸통에서 떨어지지 않도록 주의하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_shoulder04',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'shoulder05', '덤벨 측면 들기 (Lateral Raise)', '어깨', 'high',
    ARRAY['골다공증 심화', '어깨 충돌 증후군', '고혈압 조절 불량'],
    '1. 가벼운 덤벨(0.5~1kg)을 양손에 들고 섭니다.
2. 팔꿈치를 살짝 구부린 채 양팔을 옆으로 어깨 높이까지 들어올립니다.
3. 2초 유지합니다.
4. 천천히 내립니다.
5. 10회 반복합니다.
숨을 참지 마세요. 어깨 높이 이상으로 올리지 마세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_shoulder05',
    ARRAY['diabetes_safe'],
    NOW()
),
(
    'wrist01', '손목 굽히기/펴기 (Wrist Flexion/Extension)', '손목', 'low',
    ARRAY[]::TEXT[],
    '1. 테이블에 팔뚝을 올려놓고 손목을 테이블 끝에 걸칩니다.
2. 손목을 천천히 위로 구부립니다.
3. 5초 유지 후 천천히 아래로 구부립니다.
4. 5초 유지합니다.
5. 각 방향 10회 반복합니다.
통증이 느껴지는 범위를 넘지 마세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_wrist01',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'wrist02', '손목 돌리기 (Wrist Circles)', '손목', 'low',
    ARRAY['손목 골절 후 4주 이내'],
    '1. 팔꿈치를 구부리고 손을 앞으로 내밉니다.
2. 손목을 시계 방향으로 천천히 원을 그리며 돌립니다.
3. 10회 돌린 후 반시계 방향으로 10회 돌립니다.
4. 통증 없는 범위에서 실시합니다.
5. 3세트 반복합니다.
뚝뚝 소리가 나도 통증이 없으면 계속해도 됩니다.',
    'https://youtube.com/watch?v=PLACEHOLDER_wrist02',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'wrist03', '손가락 굽히기/펴기 (Finger Flexion/Extension)', '손목', 'low',
    ARRAY[]::TEXT[],
    '1. 손을 앞으로 뻗어 손가락을 쭉 펩니다.
2. 천천히 주먹을 쥡니다.
3. 3초 유지합니다.
4. 다시 손가락을 천천히 펩니다.
5. 10회 반복합니다.
손가락 관절에 통증이 있으면 범위를 줄이세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_wrist03',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'wrist04', '손목 저항 운동 (Wrist Resistance Exercise)', '손목', 'medium',
    ARRAY['손목 골절 후 6주 이내', '손목 인대 파열'],
    '1. 테이블에 팔뚝을 올려놓습니다.
2. 반대 손으로 저항을 주면서 손목을 위로 구부립니다.
3. 5초간 저항을 유지합니다.
4. 천천히 이완합니다.
5. 10회 반복 후 반대쪽도 실시합니다.
저항이 너무 강하지 않도록 조절하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_wrist04',
    ARRAY['diabetes_safe', 'hypertension_safe', 'osteoporosis_safe'],
    NOW()
),
(
    'wrist05', '악력 강화 운동 (Grip Strengthening)', '손목', 'medium',
    ARRAY['손목 골절 후 8주 이내', '고혈압 조절 불량'],
    '1. 부드러운 공(테니스공 또는 스트레스 볼)을 손에 쥡니다.
2. 최대한 꽉 쥡니다.
3. 5초 유지합니다.
4. 천천히 힘을 풉니다.
5. 10회 반복 후 반대 손도 실시합니다.
고혈압 환자는 혈압 상승 위험이 있으므로 의사와 상담 후 실시하세요.',
    'https://youtube.com/watch?v=PLACEHOLDER_wrist05',
    ARRAY['diabetes_safe', 'osteoporosis_safe'],
    NOW()
)
ON CONFLICT (exercise_id) DO NOTHING;