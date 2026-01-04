import DeviceInfo from 'react-native-device-info';

const platformInfo = DeviceInfo.getModel();

type LogType = 'info' | 'warn' | 'error' | 'log' | 'debug';

interface Styles {
    [key: string]: string;
}

// Define custom logging function
const log = (message: string, type: LogType = 'info') => {
    const styles: Styles = {
        info: '\x1b[34m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        log: '\x1b[37m',
        debug: '\x1b[35m',
    };

    if (!process.env.LOCAL_TEST) {
        console[type](`${styles[type] || ''}${message} [${platformInfo}]`);
    }
};

export default log;
