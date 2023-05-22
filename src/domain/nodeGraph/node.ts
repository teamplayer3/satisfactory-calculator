import { DynamicFlow, FlowRate } from "../itemFlow";
import { Machine } from "../machine";
import { FixedResource, ResourceSlot } from "../resources";

export enum ConveyorType {
    Pipe,
    Conveyor
}

export interface Conveyor {
    type: ConveyorType
    maxFlow: FlowRate
}

export class Connection {
    id: number
    portA: Port
    portB: Port
    conveyor: Conveyor

    constructor(
        id: number,
        portA: Port,
        portB: Port,
        conveyor: Conveyor
    ) {
        this.id = id
        this.portA = portA
        this.portB = portB
        this.conveyor = conveyor
    }

    get maxFlow(): number {
        const inPortFlow = this.portA.flow.rate
        const conveyorMaxRate = this.conveyor.maxFlow.rate
        return Math.min(inPortFlow, conveyorMaxRate)
    }

    //if number is under 0 a underflow happens
    calculateUnderOverflowOnInput(): number {
        const inPortFlow = this.portA.flow.rate
        const conveyorMaxRate = this.conveyor.maxFlow.rate
        return inPortFlow - conveyorMaxRate
    }

    //if number is under 0 a underflow happens
    calculateUnderOverflowOnOutput(): number {
        const outPortFlow = this.portB.flow.rate
        const inPortFlow = this.portA.flow.rate
        const conveyorMaxRate = this.conveyor.maxFlow.rate
        return Math.min(conveyorMaxRate, inPortFlow) - outPortFlow
    }
}

export enum PortMode {
    input,
    output
}

class Port {
    id: number
    connection: Connection | undefined
    flow: FlowRate
    item: ResourceSlot
    node: Node
    mode: PortMode

    constructor(id: number, node: Node, mode: PortMode, flow: FlowRate, item: ResourceSlot) {
        this.id = id
        this.connection = undefined
        this.flow = flow
        this.item = item
        this.node = node
        this.mode = mode
    }

    get maxFlow(): number {
        return this.flow.rate
    }

    canConnectTo(port: Port): boolean {
        return this.item.resource === port.item.resource && this.mode === PortMode.output && port.mode === PortMode.input
    }

    canConnectFrom(port: Port): boolean {
        return this.item.resource === port.item.resource && this.mode === PortMode.input && port.mode === PortMode.output
    }

    connectTo(connectionId: number, port: Port, conveyor: Conveyor) {
        this.connection = new Connection(connectionId, this, port, conveyor)
    }

    connectFrom(connectionId: number, port: Port, conveyor: Conveyor) {
        this.connection = new Connection(connectionId, port, this, conveyor)
    }
}

enum AdaptersType {
    fixedAmount,
    dynamic
}

export enum NodeType {
    Machine,
    Special
}

export default class Node {
    id: number
    ports: Port[]
    private type: NodeType
    metaData: Machine | undefined

    constructor(id: number, type: NodeType, ports: {
        id: number, mode: PortMode, flow: FlowRate, item: ResourceSlot
    }[], metaData: Machine | undefined) {
        this.id = id
        this.type = type
        this.ports = ports.map((p) => new Port(p.id, this, p.mode, p.flow, p.item))
        this.metaData = metaData
    }

    static fromMachine(id: number, machine: Machine): Node {
        if (machine.config === undefined) {
            throw "machine must be configured"
        }
        let configuredPorts: number[] = []
        const inputs = machine.config.inputs.map((c) => {
            const port = machine.ports.find((p) => p.mode === PortMode.input && configuredPorts.find((id) => id === p.id) === undefined)!
            configuredPorts.push(port.id)
            return {
                id: port.id,
                mode: port.mode,
                flow: c.flow,
                item: c.resource
            }
        })
        configuredPorts = []
        const outputs = machine.config.output.map((c) => {
            const port = machine.ports.find((p) => p.mode === PortMode.output && configuredPorts.find((id) => id === p.id) === undefined)!
            configuredPorts.push(port.id)
            return {
                id: port.id,
                mode: port.mode,
                flow: c.flow,
                item: c.resource
            }
        })
        return new Node(id, NodeType.Machine, inputs.concat(outputs).map((p) => ({
            ...p,
            item: new FixedResource(p.item)
        })), machine)
    }

    get dynamicOutputs(): Port[] {
        return this.outputPorts.filter((p) => p.flow instanceof DynamicFlow)
    }

    get dynamicInputs(): Port[] {
        return this.inputPorts.filter((p) => p.flow instanceof DynamicFlow)
    }

    get inputPorts(): Port[] {
        return this.ports.filter((port) => port.mode === PortMode.input)
    }

    get outputPorts(): Port[] {
        return this.ports.filter((port) => port.mode === PortMode.output)
    }

    getPort(portId: number): Port | undefined {
        return this.ports.find((port) => port.id === portId)
    }

    connectTo(connectionId: number, fromPortId: number, toNode: Node, toPortId: number, conveyor: Conveyor): Connection | undefined {
        const portA = this.getPort(fromPortId)!
        const portB = toNode.getPort(toPortId)!

        if (!portA?.canConnectTo(portB)) {
            return
        }

        portA.connectTo(connectionId, portB, conveyor)
        portB.connectFrom(connectionId, portA, conveyor)

        return portA.connection
    }

    update() {
        throw new Error("Method not implemented.");
    }

    connectedNodes(filter: (port: any) => boolean): Node[] {
        return this.outputPorts.filter((port) => port.connection !== undefined)
            .filter(filter)
            .map((port) => port.connection?.portB.node!)
    }

    outputConnections(): Connection[] {
        return this.outputPorts.filter((port) => port.connection !== undefined)
            .map((port) => port.connection!)
    }
}



