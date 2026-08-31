-- P09 · fn_validate_answer basic cases (mirrors @edmar/answer-core §27.2)

begin;

select plan(12);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "numeric_exact",
      "canonicalValue": "540",
      "displayValue": "540",
      "acceptedForms": ["540"],
      "normalisation": "numeric_default"
    }'::jsonb,
    '540',
    null
  ) ->> 'is_correct')::boolean,
  true,
  'numeric_exact accepts canonical value'
);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "boolean",
      "canonicalValue": "true",
      "displayValue": "True",
      "acceptedForms": ["true"],
      "normalisation": "default"
    }'::jsonb,
    'yes',
    null
  ) ->> 'is_correct')::boolean,
  true,
  'boolean accepts yes for true'
);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "option_id",
      "canonicalValue": "B",
      "displayValue": "B",
      "acceptedForms": ["B"],
      "normalisation": "default"
    }'::jsonb,
    'b',
    null
  ) ->> 'is_correct')::boolean,
  true,
  'option_id accepts case-insensitive key'
);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "currency",
      "canonicalValue": "540.00",
      "displayValue": "$540.00",
      "acceptedForms": ["540", "540.0", "540.00", "$540", "$540.00"],
      "tolerance": {"kind": "absolute", "value": 0.005},
      "precision": {"kind": "decimal_places", "value": 2, "required": true},
      "normalisation": "currency_default"
    }'::jsonb,
    '$540.00',
    null
  ) ->> 'is_correct')::boolean,
  true,
  'currency accepts $540.00'
);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "currency",
      "canonicalValue": "540.00",
      "displayValue": "$540.00",
      "acceptedForms": ["540", "540.0", "540.00", "$540", "$540.00"],
      "tolerance": {"kind": "absolute", "value": 0.005},
      "precision": {"kind": "decimal_places", "value": 2, "required": true},
      "normalisation": "currency_default",
      "commonErrorValues": [{"key": "pct_on_selling_price", "value": "470.00"}]
    }'::jsonb,
    '470.00',
    null
  ) ->> 'matched_common_error_key'),
  'pct_on_selling_price',
  'currency matches common error value'
);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "numeric_sf",
      "canonicalValue": "58.7",
      "displayValue": "58.7",
      "acceptedForms": ["58.7"],
      "tolerance": {"kind": "absolute", "value": 0.05},
      "precision": {"kind": "significant_figures", "value": 3, "required": true},
      "normalisation": "numeric_default"
    }'::jsonb,
    '58.74',
    null
  ) ->> 'reason'),
  'wrong_precision',
  'numeric_sf rejects wrong precision before value'
);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "expression",
      "canonicalValue": "8a + b",
      "displayValue": "8a + b",
      "acceptedForms": ["8a + b", "b + 8a", "8*a+b"],
      "normalisation": "expression_default"
    }'::jsonb,
    '8*a+b',
    null
  ) ->> 'is_correct')::boolean,
  true,
  'expression accepts listed accepted form only'
);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "expression",
      "canonicalValue": "8a + b",
      "displayValue": "8a + b",
      "acceptedForms": ["8a + b"],
      "normalisation": "expression_default"
    }'::jsonb,
    '9a',
    null
  ) ->> 'is_correct')::boolean,
  false,
  'expression rejects non-listed form'
);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "ratio",
      "canonicalValue": "3:5",
      "displayValue": "3:5",
      "acceptedForms": ["3:5", "3 : 5"],
      "form": {"simplestRatio": true},
      "normalisation": "numeric_default"
    }'::jsonb,
    '6:10',
    null
  ) ->> 'reason'),
  'not_simplified',
  'ratio rejects non-simplest when required'
);

select is(
  (public.fn_validate_answer(
    '{
      "answerType": "with_units",
      "canonicalValue": "40 cm^2",
      "displayValue": "40 cm²",
      "acceptedForms": ["40 cm^2", "40cm2", "40 cm²"],
      "tolerance": {"kind": "absolute", "value": 0},
      "units": {"requirement": "required", "canonical": "cm^2", "acceptedSet": ["cm^2", "cm2", "cm²"]},
      "normalisation": "units_default"
    }'::jsonb,
    '40',
    null
  ) ->> 'reason'),
  'wrong_units',
  'with_units rejects missing units when required'
);

select is(
  public.fn_normalise_answer(' 8 a + b ', 'expression_default', false),
  '8a+b',
  'normalise collapses expression whitespace'
);

select is(
  public.fn_normalise_answer('$540.00', 'currency_default', false),
  '540.00',
  'normalise strips currency prefix'
);

select * from finish();

rollback;
