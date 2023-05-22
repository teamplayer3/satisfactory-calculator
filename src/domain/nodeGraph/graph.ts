import { DynamicFlow } from "../itemFlow";
import Node, { Connection, Conveyor, PortMode } from "./node";

class UpdateRegistry {
    private nodes: number[]

    constructor() {
        this.nodes = []
    }

    push(id: number) {
        this.nodes.push(id)
    }

    clear() {
        this.nodes = []
    }

    pop(): number | undefined {
        return this.nodes.pop()
    }
}

export class NodeGraph {
    nodeIdMap: Map<number, number>

    nodes: Node[]

    nodesToUpdate: Node[]

    constructor() {
        this.nodes = []
        this.nodesToUpdate = []
        this.nodeIdMap = new Map()
    }

    getNode(id: number): undefined | Node {
        const index = this.nodeIdMap.get(id)
        if (index !== undefined) {
            return this.nodes[index]
        }
    }

    push(node: Node) {
        const nodeNotExists = this.nodeIdMap.get(node.id) === undefined
        if (nodeNotExists) {
            this.pushNode(node)
        }
    }

    connectNodes(connectionId: number, fromId: number, toId: number, fromPortId: number, toPortId: number, conveyor: Conveyor): Connection | undefined {
        const fromNode = this.getNode(fromId)
        const toNode = this.getNode(toId)

        if (fromNode && toNode) {
            return fromNode.connectTo(connectionId, fromPortId, toNode, toPortId, conveyor)
        }
    }

    private discoverDynamicNetwork(from: Node) {
        const toDiscover = [from]
        const nodeIds = []
        while (true) {
            const curr = toDiscover.pop()
            const dynamicOutputs = curr?.dynamicOutputs
            if (dynamicOutputs?.length !== 0) {
                nodeIds.push(curr?.id)
                dynamicOutputs?.forEach((p) => {
                    if (p.connection) {
                        const nextNode = p.connection.portB.node

                    }
                })
            }
        }
    }

    private pushNode(node: Node) {
        this.nodeIdMap.set(node.id, this.nodes.length)
        this.nodes.push(node)
    }

    getLinkArray(): {
        fromNode: number,
        toNode: number,
        fromPort: number,
        toPort: number
    }[] {
        let links: {
            fromNode: number,
            toNode: number,
            fromPort: number,
            toPort: number
        }[] = []
        this.nodes.forEach((node) => {
            node.ports.forEach((port) => {
                if (port.mode === PortMode.output && port.connection !== undefined) {
                    links.push({
                        fromNode: node.id,
                        toNode: port.connection.portB.node.id,
                        fromPort: port.id,
                        toPort: port.connection.portB.id
                    })
                }
            })
        })
        return links
    }

    update(): UpdateRecord {
        const updatedNodes: Node[] = []
        const updatedConnections: Connection[] = []

        function wasNodeAlreadyUpdated(node: Node): boolean {
            return updatedNodes.find((n) => n.id === node.id) !== undefined
        }

        const nodesToUpdate = this.nodesToUpdate
        this.nodesToUpdate = []

        while (nodesToUpdate.length !== 0) {
            const node = nodesToUpdate.pop()!
            if (!wasNodeAlreadyUpdated(node)) {
                node.update()
                updatedNodes.push(node)
                nodesToUpdate.push(...node.connectedNodes((port) => port.mode === PortMode.output && port.flow instanceof DynamicFlow))
                updatedConnections.push(...node.outputConnections())
            }
        }

        return {
            updatedConnections,
            updatedNodes
        }
    }
}

interface UpdateRecord {
    updatedNodes: Node[]
    updatedConnections: Connection[]
}