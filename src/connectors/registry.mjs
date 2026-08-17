import { ContractValidationError } from '../../scripts/lib/contract-validation.mjs';
const fail=(code,path,message)=>{throw new ContractValidationError(code,path,message)};

export class ConnectorRegistry{
  #adapters=new Map();

  register(adapter){
    const key=`${adapter.connectorId}@${adapter.version}`;
    if(this.#adapters.has(key))fail('CONNECTOR_IDENTITY_COLLISION','$',key);
    if(typeof adapter.execute!=='function'||typeof adapter.observeOperation!=='function'){
      fail('INVALID_ADAPTER','$','execute and observeOperation required');
    }
    this.#adapters.set(key,adapter);
    return key;
  }

  resolve(connectorId,version){
    const key=`${connectorId}@${version}`;
    const adapter=this.#adapters.get(key);
    if(!adapter)fail('CONNECTOR_NOT_REGISTERED','$',key);
    return adapter;
  }
}
