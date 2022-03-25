declare namespace NSpell {
    interface ISpellTime {
        number: number
        unit: string
    }

    interface ISpellRangeDistance {
        type: string
        amount: number
    }

    interface ISpellRange {
        type: string
        distance: ISpellRangeDistance
    }

    interface ISpellComponents {
        v: boolean
        s: boolean
        m: any | any[]
    }

    interface ISpellDuration {
        type: string
    }

    interface ISpellClass {
        name: string
        source: string
    }

    interface ISpell {
        name: string
        englishName: string
        altName: string
        level: number
        school: string
        time: ISpellTime[]
        range: ISpellRange
        components: ISpellComponents
        duration: ISpellDuration[]
        classes: {
            fromClassList: ISpellClass[]
        }
        source: string
        entries: string[]
        page: number
        damageInflict: string[]
        savingThrow: string[]
    }
}

export default NSpell
