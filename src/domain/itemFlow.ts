export interface FlowRate {
    rate: number //items per minute
}

export class FixedFlow implements FlowRate {
    rate: number

    constructor(rate: number) {
        this.rate = rate
    }
}

export class DynamicFlow implements FlowRate {
    rate: number

    constructor(init: number) {
        this.rate = init
    }


    update(flow: number) {
        this.rate = flow
    }
}