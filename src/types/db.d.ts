declare namespace DB {
    interface ISpell {
        readonly _id: string,
        readonly name: string,
        readonly aliases: string[],
        readonly level: number,
        readonly text: string,
        readonly school: string,
        readonly castingTime: string,
        readonly range: string,
        readonly materials: string,
        readonly components: string,
        readonly duration: string,
        readonly source: string,
        readonly ritual?: string,
    }
}

export default DB
