export class ConnectorFault extends Error{
  constructor(code,message,details={}){super(message);Object.assign(this,{name:'ConnectorFault',code,details})}
}
export class UnknownCompletionError extends ConnectorFault{
  constructor(details={}){super('UNKNOWN_COMPLETION','completion unknown',details)}
}
export class RateLimitError extends ConnectorFault{
  constructor(retryAfterMs){super('RATE_LIMITED','rate limited',{retryAfterMs})}
}
export class PartialSuccessError extends ConnectorFault{
  constructor(details={}){super('PARTIAL_SUCCESS','partial success',details)}
}
export class SchemaDriftError extends ConnectorFault{
  constructor(details={}){super('SCHEMA_DRIFT','schema drift',details)}
}
