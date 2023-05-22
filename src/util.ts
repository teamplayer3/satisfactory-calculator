

export const zip = <A, B>(a: A[], b: B[]): [A, B][] => {
    return a.map(function (e: A, i) {
        return [e, b[i]];
    })
} 