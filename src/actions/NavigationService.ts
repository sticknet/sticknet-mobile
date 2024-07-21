import {CommonActions, NavigationContainerRef} from '@react-navigation/native';

let _navigator: NavigationContainerRef<any> | null = null;

function setTopLevelNavigator(navigatorRef: NavigationContainerRef<any> | null) {
    _navigator = navigatorRef;
}

function navigate(routeName: string, params?: object) {
    if (_navigator) {
        _navigator.dispatch(CommonActions.navigate({name: routeName, params, merge: true}));
    }
}

function getRoute(): string | null {
    if (_navigator) {
        const currentRoute = _navigator.getCurrentRoute();
        return currentRoute ? currentRoute.name : null;
    }
    return null;
}

export default {
    navigate,
    setTopLevelNavigator,
    getRoute,
};
