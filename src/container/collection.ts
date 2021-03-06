import { CollectionFactory, ContainerFactory, EuvInstance, InjectTagIdentifier, ServiceTables } from '../interfaces'
import { ComponentOptions } from 'vue'
import Vue from 'vue'
import { metadata } from '../constants'
import { Mutation } from './mutation'
import { VueConstructor } from 'vue/types/vue'


export class Collection implements CollectionFactory {
  
  private _instance: EuvInstance
  private _vueComponent: VueConstructor<Vue>
  private _dependencies: string[] = []
  readonly optionalDeps: number[] = []
  readonly componentOptions: ComponentOptions<Vue>
  
  get instance(): EuvInstance {
    if (!this._instance) this.init()
    return this._instance
  }
  get vueComponent(): VueConstructor<Vue> {
    if (!this._instance) this.init()
    return this._vueComponent
  }
  get vueComponentOptions(): any {
    return this.componentOptions || {}
  }
  get bindingName(): string {
    return this.name
  }
  
  constructor(
    public factory: new (...args: any[]) => any,
    private name: string,
    private container: ContainerFactory,
  ) {
    this.componentOptions = Reflect.getMetadata(metadata.COMPONENT_IDENTIFIER, factory)
    this.optionalDeps = Reflect.getMetadata(metadata.OPTIONAL_IDENTIFIER, factory)
    this.updateDependencies()
  }
  
  isInstantiated(): boolean {
    return !!this._instance
  }
  
  isComponent(): boolean {
    return !!this.componentOptions
  }
  
  private init(): void {
    // not found deps
    if (!this._dependencies.length) return this.updateCollection()
    
    // collect recursive deps
    const dependentInstances: EuvInstance[] = this._dependencies.map((dep, i) => {
      const isOptional: boolean = this.optionalDeps
        && this.optionalDeps.length
        && this.optionalDeps.find(index => index === i) !== undefined
      
      if (!isOptional) {
        const instance: EuvInstance = this.container.findOne(dep).instance
        // include optional dep
        this.container.optionalPool.has(dep) && this.container.optionalPool.patch(dep, instance)
        return instance
      }
  
      // optional inject
      this.container.optionalPool.create(dep)
      return this.container.optionalPool.link(dep)
    })
    
    return this.updateCollection(dependentInstances)
  }
  
  private updateCollection(dependentInstances?: EuvInstance[]): void {
    if (!this.isComponent()) {
      this._instance = new this.factory(dependentInstances)
      return
    }
    this._vueComponent = new Mutation(this, dependentInstances, this.container).toVueComponent()
    this._instance = class None {}
  }
  
  private updateDependencies(): void {
    const tokens: InjectTagIdentifier[] = Reflect.getMetadata(metadata.INJECT_TOKEN_IDENTIFIER, this.factory) || []
    const types: any[] = Reflect.getMetadata(metadata.HOST_PARAM_TYPES, this.factory) || []
    const nativeTables: ServiceTables = this.container.nativeTables()
    const tableKeys: string[] = Object.keys(nativeTables)
  
    this._dependencies = types.map((type, index) => {
      // is param type
      const name: string = tableKeys.find(key => nativeTables[key] === type)
      if (!!name) return name
      
      // is Inject token
      const injectToken: InjectTagIdentifier = tokens.find(token => token.index === index)
      if (injectToken && nativeTables[injectToken.name]) return injectToken.name
      
      // not found dep
      return null
    })
    .filter(r => r)
  
  }
  
}

