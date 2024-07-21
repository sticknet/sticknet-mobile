const animations = {
    iii: {
        0: {
            color: '#CCA8EF',
        },
        1: {
            color: '#6060FF',
        },
    },
    glow: {
        0: {
            scale: 1,
            color: 'rgb(215,215,215)',
        },
        1: {
            scale: 1.05,
            color: 'rgb(255, 0, 0)',
        },
    },
    loadingRotation: {
        0: {
            transform: [{rotate: '0deg'}],
        },
        1: {
            transform: [{rotate: '359deg'}],
        },
    },
    loadingColor: {
        0: {
            backgroundColor: '#6060FF',
        },
        1: {
            backgroundColor: 'red',
        },
    },
    circle: {
        0: {
            width: 32,
        },
        1: {
            width: 100,
        },
    },
};

export default animations;
