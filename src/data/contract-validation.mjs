import { assertNoForbiddenSecrets, sha256 } from '../../scripts/lib/contract-validation.mjs';

export class DataContractError extends Error {
  constructor(code, path, message) { super(`${path}: ${message}`); Object.assign(this, { name:'DataContractError', code, path }); }
}
const fail=(c,p,m)=>{throw new DataContractError(c,p,m)};
const plain=(v)=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const obj=(v,p)=>{if(!plain(v))fail('INVALID_TYPE',p,'expected object')};
const str=(v,p)=>{if(typeof v!=='string'||!v)fail('INVALID_TYPE',p,'expected non-empty string')};
const num01=(v,p)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)fail('INVALID_VALUE',p,'expected number in [0,1]')};
const arr=(v,p,min=0)=>{if(!Array.isArray(v)||v.length<min)fail('INVALID_TYPE',p,`expected array with >= ${min} items`)};
const exact=(v,keys,required,p)=>{obj(v,p);for(const k of Object.keys(v))if(!keys.includes(k))fail('UNEXPECTED_FIELD',`${p}.${k}`,'not part of contract');for(const k of required)if(!(k in v))fail('MISSING_FIELD',`${p}.${k}`,'required')};
const unique=(items,key,p)=>{const seen=new Set();for(let i=0;i<items.length;i++){const value=typeof key==='function'?key(items[i]):items[i][key];if(seen.has(value))fail('DUPLICATE_IDENTITY',`${p}[${i}]`,`duplicate ${value}`);seen.add(value)}};
const DIGEST=/^[a-f0-9]{64}$/;
const SEMVER=/^\d+\.\d+\.\d+$/;
const METRIC_KEYS=['schema','metric_id','version','name','description','owner_role','source_system_id','unit','currency','timezone','grain','aggregation','scope','effective_time','lineage_subjects','status'];
const PROFILE_KEYS=['schema','profile_id','tenant_ref','task_id','source_subject','evaluated_at','fields','declared_overall_state'];
const DECISION_KEYS=['schema','readiness_id','tenant_ref','task_id','metric_ref','profile_ref','access_disposition','semantic_state','freshness_state','state','blocking_reasons','degraded_reasons','evaluated_at','evaluator_version','input_digest','invalidates_evidence_subjects'];

export function validateSemanticMetricDefinition(metric){
  assertNoForbiddenSecrets(metric); exact(metric,METRIC_KEYS,METRIC_KEYS.filter(k=>k!=='currency'),'$');
  if(metric.schema!=='fde-agent/semantic-metric-definition/v1')fail('SCHEMA_MISMATCH','$.schema','unexpected schema');
  ['metric_id','name','description','owner_role','source_system_id','unit','timezone'].forEach(k=>str(metric[k],`$.${k}`));
  if(!SEMVER.test(metric.version))fail('INVALID_VERSION','$.version','expected semver');
  if(metric.currency!==undefined&&metric.currency!==null)str(metric.currency,'$.currency');
  if(!['EVENT','CASE','DAY','WEEK','MONTH'].includes(metric.grain))fail('INVALID_GRAIN','$.grain','unsupported grain');
  if(!['COUNT','SUM','AVG','RATE','PERCENTILE','CUSTOM'].includes(metric.aggregation))fail('INVALID_AGGREGATION','$.aggregation','unsupported aggregation');
  exact(metric.scope,['tenant_ref','process_id','population_filter'],['tenant_ref','process_id','population_filter'],'$.scope');
  ['tenant_ref','process_id','population_filter'].forEach(k=>str(metric.scope[k],`$.scope.${k}`));
  exact(metric.effective_time,['valid_from','valid_to'],['valid_from','valid_to'],'$.effective_time'); str(metric.effective_time.valid_from,'$.effective_time.valid_from');
  if(metric.effective_time.valid_to!==null)str(metric.effective_time.valid_to,'$.effective_time.valid_to');
  arr(metric.lineage_subjects,'$.lineage_subjects',1); metric.lineage_subjects.forEach((x,i)=>{const p=`$.lineage_subjects[${i}]`;exact(x,['subject_type','subject_id','digest'],['subject_type','subject_id','digest'],p);str(x.subject_type,`${p}.subject_type`);str(x.subject_id,`${p}.subject_id`);if(!DIGEST.test(x.digest))fail('INVALID_DIGEST',`${p}.digest`,'expected sha256');}); unique(metric.lineage_subjects,x=>`${x.subject_type}:${x.subject_id}:${x.digest}`,'$.lineage_subjects');
  if(!['DRAFT','VALIDATED','ACTIVE','SUPERSEDED'].includes(metric.status))fail('INVALID_STATUS','$.status','unsupported metric status');
  return true;
}

export function validateDataQualityProfile(profile){
  assertNoForbiddenSecrets(profile); exact(profile,PROFILE_KEYS,PROFILE_KEYS,'$');
  if(profile.schema!=='fde-agent/data-quality-profile/v1')fail('SCHEMA_MISMATCH','$.schema','unexpected schema');
  ['profile_id','tenant_ref','task_id','evaluated_at'].forEach(k=>str(profile[k],`$.${k}`));
  exact(profile.source_subject,['source_id','digest','schema_version'],['source_id','digest','schema_version'],'$.source_subject'); str(profile.source_subject.source_id,'$.source_subject.source_id'); str(profile.source_subject.schema_version,'$.source_subject.schema_version'); if(!DIGEST.test(profile.source_subject.digest))fail('INVALID_DIGEST','$.source_subject.digest','expected sha256');
  arr(profile.fields,'$.fields',1); profile.fields.forEach((x,i)=>{const p=`$.fields[${i}]`;exact(x,['field_path','critical','completeness','validity','uniqueness','consistency','observed_age_seconds','status','issue_codes'],['field_path','critical','completeness','validity','uniqueness','consistency','observed_age_seconds','status','issue_codes'],p);str(x.field_path,`${p}.field_path`);if(typeof x.critical!=='boolean')fail('INVALID_TYPE',`${p}.critical`,'expected boolean');['completeness','validity','uniqueness','consistency'].forEach(k=>num01(x[k],`${p}.${k}`));if(!Number.isInteger(x.observed_age_seconds)||x.observed_age_seconds<0)fail('INVALID_VALUE',`${p}.observed_age_seconds`,'expected non-negative integer');if(!['PASS','DEGRADED','FAIL'].includes(x.status))fail('INVALID_STATUS',`${p}.status`,'unsupported field status');arr(x.issue_codes,`${p}.issue_codes`);x.issue_codes.forEach((c,j)=>str(c,`${p}.issue_codes[${j}]`));unique(x.issue_codes,c=>c,`${p}.issue_codes`);}); unique(profile.fields,'field_path','$.fields');
  if(!['PASS','DEGRADED','FAIL'].includes(profile.declared_overall_state))fail('INVALID_STATUS','$.declared_overall_state','unsupported overall state');
  return true;
}

export function validateDataReadinessDecision(decision){
  assertNoForbiddenSecrets(decision); exact(decision,DECISION_KEYS,DECISION_KEYS,'$'); if(decision.schema!=='fde-agent/data-readiness-decision/v1')fail('SCHEMA_MISMATCH','$.schema','unexpected schema'); ['readiness_id','tenant_ref','task_id','evaluated_at','evaluator_version'].forEach(k=>str(decision[k],`$.${k}`));
  exact(decision.metric_ref,['metric_id','version','digest'],['metric_id','version','digest'],'$.metric_ref'); str(decision.metric_ref.metric_id,'$.metric_ref.metric_id'); str(decision.metric_ref.version,'$.metric_ref.version'); if(!DIGEST.test(decision.metric_ref.digest))fail('INVALID_DIGEST','$.metric_ref.digest','expected sha256');
  exact(decision.profile_ref,['profile_id','digest'],['profile_id','digest'],'$.profile_ref'); str(decision.profile_ref.profile_id,'$.profile_ref.profile_id'); if(!DIGEST.test(decision.profile_ref.digest))fail('INVALID_DIGEST','$.profile_ref.digest','expected sha256');
  if(!['AUTHORIZED','UNAUTHORIZED','UNKNOWN'].includes(decision.access_disposition))fail('INVALID_ACCESS_DISPOSITION','$.access_disposition','unsupported'); if(!['CONSISTENT','CONFLICTED','UNKNOWN'].includes(decision.semantic_state))fail('INVALID_SEMANTIC_STATE','$.semantic_state','unsupported'); if(!['FRESH','STALE','UNKNOWN'].includes(decision.freshness_state))fail('INVALID_FRESHNESS_STATE','$.freshness_state','unsupported'); if(!['READY','DEGRADED','BLOCKED'].includes(decision.state))fail('INVALID_READINESS_STATE','$.state','unsupported');
  ['blocking_reasons','degraded_reasons','invalidates_evidence_subjects'].forEach(k=>{arr(decision[k],`$.${k}`);decision[k].forEach((x,i)=>str(x,`$.${k}[${i}]`));unique(decision[k],x=>x,`$.${k}`)}); if(!DIGEST.test(decision.input_digest))fail('INVALID_DIGEST','$.input_digest','expected sha256');
  if(decision.state==='READY'&&(decision.blocking_reasons.length||decision.degraded_reasons.length))fail('INCONSISTENT_READINESS','$.state','READY cannot carry reasons');
  if(decision.state==='DEGRADED'&&(!decision.degraded_reasons.length||decision.blocking_reasons.length))fail('INCONSISTENT_READINESS','$.state','DEGRADED requires only degraded reasons');
  if(decision.state==='BLOCKED'&&!decision.blocking_reasons.length)fail('INCONSISTENT_READINESS','$.state','BLOCKED requires blocking reasons');
  return true;
}

const semanticProjection=(metric)=>({owner_role:metric.owner_role,source_system_id:metric.source_system_id,unit:metric.unit,currency:metric.currency??null,timezone:metric.timezone,grain:metric.grain,aggregation:metric.aggregation,scope:metric.scope,effective_time:metric.effective_time,lineage_subjects:metric.lineage_subjects});
export function detectSemanticDrift(previous,current){validateSemanticMetricDefinition(previous);validateSemanticMetricDefinition(current);return sha256(semanticProjection(previous))!==sha256(semanticProjection(current));}
export function assertSemanticEvidenceFresh(previous,current,evidenceSubjects=[]){if(detectSemanticDrift(previous,current)&&evidenceSubjects.length)fail('SEMANTIC_DRIFT_INVALIDATES_EVIDENCE','$.dependent_evidence','baseline/Eval evidence must be revalidated');return true;}
