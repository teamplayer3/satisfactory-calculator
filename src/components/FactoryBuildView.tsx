import * as go from 'gojs';
import produce from 'immer';
import { useCallback, useState } from 'react';
import { Diagram } from '../domain/diagram';
import { FixedFlow, FlowRate } from '../domain/itemFlow';

import { MachineConfiguration, MachineConfigurations, Machines } from "../domain/machine";
import { NodeGraph } from '../domain/nodeGraph/graph';
import Node, { ConveyorType } from "../domain/nodeGraph/node";
import { zip } from '../util';
import { ConveyorSelection } from './ConveyorSelection';
import DiagramWrapper from './DiagramWrapper';
import { useDiagram } from './GoJsDiagram';
import { RecipeSelection } from './RecipeSelection';


interface DiagramState {
    nodeGraph: NodeGraph,
    skipsDiagramUpdate: boolean,
    modelData: go.ObjectData,
    selectedData: go.ObjectData | null
}

export default function FactoryBuildView() {

    const [diagram] = useDiagram()
    const [diagramState, setDiagramState] = useState<DiagramState>({
        nodeGraph: new NodeGraph(),
        skipsDiagramUpdate: false,
        modelData: {
            canRelink: true
        },
        selectedData: null,
    })

    const [selectConfig, setSelectConfig] = useState<{
        partToConfig: go.ObjectData
    } | undefined>(undefined)

    const [selectConveyor, setSelectConveyor] = useState<{
        linkToConfig: go.ObjectData
        conveyorType: ConveyorType
    } | undefined>(undefined)

    const updatePartWithConfig = useCallback((config: MachineConfiguration) => {
        if (selectConfig && diagram instanceof Diagram) {
            const part = selectConfig.partToConfig as any
            const machineName = part.name
            const newNode = Node.fromMachine(part.key, Machines.getConfiguredByName(machineName, config)!)
            diagram.updateNodes([newNode])
            setDiagramState(
                produce((state) => {
                    state.nodeGraph.push(newNode)
                })
            )
        }

        setSelectConfig(undefined)
    }, [diagram, selectConfig])

    function onCancelPartSelection() {
        if (selectConfig && diagram instanceof Diagram) {
            const nodeData = selectConfig.partToConfig
            diagram.deleteNodes([nodeData.key])
        }

        setSelectConfig(undefined)
    }

    const onSelectConveyor = (flow: FlowRate) => {
        const link = selectConveyor?.linkToConfig!
        const connection = diagramState.nodeGraph.connectNodes(link.key, link.from, link.to, link.fromPort, link.toPort, {
            type: ConveyorType.Conveyor,
            maxFlow: flow
        })

        if (connection && diagram instanceof Diagram) diagram.updateConnections([connection])
        setSelectConveyor(undefined)
    }

    const onCancelConveyorSelection = () => {
        if (selectConveyor && diagram instanceof Diagram) {
            diagram.deleteConnections([selectConveyor.linkToConfig.key])
        }
        setSelectConveyor(undefined)
    }

    const onModelChange = useCallback((obj: go.IncrementalData) => {
        const insertedNodeKeys = obj.insertedNodeKeys;
        const modifiedNodeData = obj.modifiedNodeData;
        // const removedNodeKeys = obj.removedNodeKeys;
        const insertedLinkKeys = obj.insertedLinkKeys;
        const modifiedLinkData = obj.modifiedLinkData;
        // const removedLinkKeys = obj.removedLinkKeys;
        // const modifiedModelData = obj.modelData;

        if (insertedNodeKeys && modifiedNodeData) {
            zip(insertedNodeKeys, modifiedNodeData).forEach(([key, node]) => {
                if (diagramState.nodeGraph.getNode(key as number) === undefined) {
                    setSelectConfig({
                        partToConfig: node
                    })
                }
            })
        }

        if (insertedLinkKeys && modifiedLinkData) {
            zip(insertedLinkKeys, modifiedLinkData).forEach(([key, link]) => {
                setSelectConveyor({
                    conveyorType: ConveyorType.Conveyor,
                    linkToConfig: link,
                })
            })
        }
    }, [diagramState])

    return (
        <div>
            <RecipeSelection
                visible={selectConfig !== undefined}
                selectionList={MachineConfigurations.configs.filter((config) => {
                    if (selectConfig) {
                        const part = selectConfig.partToConfig as any
                        return part.name === config.targetMachine
                    } else {
                        return false
                    }
                })}
                onSelected={updatePartWithConfig}
                onCancel={onCancelPartSelection} />
            <ConveyorSelection
                visible={selectConveyor !== undefined}
                selectionList={[new FixedFlow(60), new FixedFlow(120), new FixedFlow(270)]}
                onCancel={onCancelConveyorSelection}
                onSelected={onSelectConveyor} />
            <DiagramWrapper
                linkDataArray={[]}
                nodeDataArray={[]}
                modelData={{}}
                onModelChange={onModelChange}
                skipsDiagramUpdate={diagramState.skipsDiagramUpdate}
                onDiagramEvent={() => { }}
                style={{
                    width: "1000px",
                    height: "1000px",
                    border: "solid 1px black",
                    backgroundColor: "white",
                }} />
        </div >
    );
}