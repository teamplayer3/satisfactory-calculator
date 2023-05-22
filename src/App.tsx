
// App.js
import React from 'react';

import './App.css';  // contains .diagram-component CSS
import FactoryBuildView from './components/FactoryBuildView';
import { enableMapSet } from 'immer';
import { DiagramProvider } from './components/GoJsDiagram';

enableMapSet()

// let minerMachine = Machines.getConfiguredByName("Miner", MachineConfigurations.getByName("Iron Ore")!)!
// const nodeA = Node.fromMachine(0, minerMachine)

// let smelterMachine = Machines.getConfiguredByName("Smelter", MachineConfigurations.getByName("Iron Ingot")!)!
// const nodeB = Node.fromMachine(1, smelterMachine)

// let constrMachine = Machines.getConfiguredByName("Constructor", MachineConfigurations.getByName("Iron Plate")!)!
// const nodeC = Node.fromMachine(2, constrMachine)

// let manufactMachine = Machines.getConfiguredByName("Manufacturer", MachineConfigurations.getByName("Computer")!)!
// const nodeD = Node.fromMachine(3, manufactMachine)

// initialize the Palette that is on the left side of the page


// render function...
function App() {

  return (
    <DiagramProvider>
      <FactoryBuildView />
    </DiagramProvider>
  )
}



export default App;
