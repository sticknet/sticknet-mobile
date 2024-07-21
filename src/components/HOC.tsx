import React, {PureComponent, ComponentType} from 'react';

function HOC<T extends object>(WrappedComponent: ComponentType<T>) {
    return class extends PureComponent<T> {
        render() {
            return <WrappedComponent {...this.props} />;
        }
    };
}

export default HOC;
