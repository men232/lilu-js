export interface PermissionAttributes {
  [key: string]: any
}

export interface PermissionOptions {
  title: string,

  actions: Array<string>,

  attributes: PermissionAttributes
}

export class Permission {
  constructor(options: Partial<PermissionOptions>) {
  }

  get actions(): Array<string> {
    return [];
  }
}
