import resources from "../game_resources/resources.json"

export interface Resource {
    name: string
}

export class Resources {
    private static resources: Resource[] = resources

    static getByName(name: string): Resource | undefined {
        return Resources.resources.find((r) => r.name === name)
    }
}

export interface ResourceSlot {
    resource: Resource | undefined
}

export class FixedResource implements ResourceSlot {
    resource: Resource

    constructor(resource: Resource) {
        this.resource = resource
    }
}

export class DynamicResource implements ResourceSlot {
    resource: Resource | undefined

    constructor(init: Resource | undefined) {
        this.resource = init
    }

    update(resource: Resource | undefined) {
        this.resource = resource
    }
}