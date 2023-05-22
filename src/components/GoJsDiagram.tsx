import { createRef, useState, useEffect, useContext, createContext, ReactNode } from "react"
import * as go from 'gojs';
import { Diagram } from "../domain/diagram";

const DiagramContext = createContext<[Diagram | undefined, (diagram: Diagram) => void]>([undefined, () => { }])

export function DiagramProvider(props: { children: ReactNode[] | ReactNode }) {
    const [diagram, setDiagram] = useState<Diagram | undefined>()
    return (
        <DiagramContext.Provider value={[diagram, (diagram: Diagram) => setDiagram(diagram)]}>
            {props.children}
        </DiagramContext.Provider>
    );
}

export const useDiagram = () => useContext(DiagramContext)

export default function ReactDiagram(props: {
    initDiagram: () => go.Diagram;
    divClassName: string;
    style?: React.CSSProperties;
    nodeDataArray: Array<go.ObjectData>;
    linkDataArray?: Array<go.ObjectData>;
    modelData?: go.ObjectData;
    skipsDiagramUpdate?: boolean;
    onModelChange?: (e: go.IncrementalData) => void;
}) {

    const divRef = createRef<HTMLDivElement>()

    const [, setDiagram] = useDiagram()

    const [, setWasCleared] = useState(false)

    // first init
    useEffect(() => {
        if (divRef.current === null) return

        var diagram = props.initDiagram();
        diagram.div = divRef.current;
        const modelChangeListener = (e: go.ChangedEvent) => {
            if (e !== undefined && e.isTransactionFinished && e.model && !e.model.isReadOnly && props.onModelChange) {
                var dataChanges = e.model.toIncrementalData(e)
                if (dataChanges !== null && props.onModelChange !== undefined)
                    props.onModelChange(dataChanges)
            }
        }
        diagram.addModelChangedListener(modelChangeListener)
        diagram.delayInitialization(function () {
            mergeData(diagram, true);
        })

        setDiagram(new Diagram(diagram))

        return () => {
            var diagram = getDiagram();
            if (diagram !== null) {
                diagram.div = null
                diagram.removeModelChangedListener(modelChangeListener)
            }
        }
    }, [divRef.current])

    const getDiagram = () => {
        if (divRef.current === null)
            return null;
        return go.Diagram.fromDiv(divRef.current);
    }

    const clear = () => {
        var diagram = getDiagram();
        if (diagram !== null) {
            diagram.clear();
            setWasCleared(true)
        }
    }

    const mergeData = (diagram: go.Diagram, isInit: boolean) => {
        const model = diagram.model;
        model.commit((m) => {
            if (props.modelData !== undefined) {
                m.assignAllDataProperties(m.modelData, props.modelData);
            }
            m.mergeNodeDataArray(props.nodeDataArray);
            if (props.linkDataArray !== undefined && m instanceof go.GraphLinksModel) {
                m.mergeLinkDataArray(props.linkDataArray);
            }
        }, isInit ? 'initial merge' : 'merge data');
    }

    return (
        <div ref={divRef} className={props.divClassName} style={props.style} />
    )
}
