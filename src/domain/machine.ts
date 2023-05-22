import { FixedFlow, FlowRate } from "./itemFlow"
import { PortMode } from "./nodeGraph/node"
import { Resource, Resources } from "./resources"

import recipes from './../game_resources/recipes.json';
import machines from './../game_resources/machines.json'

interface Port {
    id: number,
    mode: PortMode
}

export interface MachineTemplate {
    id: number
    name: string
    ports: {
        id: number,
        mode: PortMode,
    }[]
}

export class Machine {
    id: number
    name: string
    config: MachineConfiguration
    ports: Port[]

    constructor(id: number, name: string, config: MachineConfiguration, ports: Port[]) {
        this.id = id
        this.name = name
        this.config = config
        this.ports = ports
    }

    static fromTemplate(template: MachineTemplate, config: MachineConfiguration): Machine {
        return new Machine(template.id, template.name, config, template.ports)
    }
}

export interface MachineConfiguration {
    name: string,
    targetMachine: string,
    inputs: {
        flow: FlowRate,
        resource: Resource
    }[]
    output: {
        flow: FlowRate,
        resource: Resource
    }[]
}

export class Machines {

    private static machines: MachineTemplate[] = machines.map((m) => ({
        ...m,
        ports: m.ports.map((p) => ({
            ...p,
            mode: p.mode === "output" ? PortMode.output : PortMode.input
        }))
    }))

    static getConfiguredByName(name: string, config: MachineConfiguration): Machine | undefined {
        const template = this.machines.find((m) => m.name === name)
        if (template === undefined) {
            return undefined
        }
        if (config.targetMachine !== template.name) {
            throw `config ${config.name} cannot applied to machine ${template.name}`
        }
        return Machine.fromTemplate(template, config)
    }

    static get machineTemplates(): MachineTemplate[] {
        return this.machines
    }
}

export class MachineConfigurations {

    private static machineConfigurations: MachineConfiguration[] = recipes.map((recipe) => ({
        ...recipe,
        inputs: recipe.inputs.map((input) => ({
            flow: new FixedFlow(input.flow),
            resource: Resources.getByName(input.resource)!
        })),
        output: recipe.output.map((output) => ({
            flow: new FixedFlow(output.flow),
            resource: Resources.getByName(output.resource)!
        }))
    }))

    static getByName(name: string): MachineConfiguration | undefined {
        return this.machineConfigurations.find((c) => c.name === name)
    }

    static get configs(): MachineConfiguration[] {
        return this.machineConfigurations
    }

}