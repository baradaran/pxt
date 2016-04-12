/// <reference path="../typings/bluebird/bluebird.d.ts"/>
/// <reference path="../typings/winrt/winrt.d.ts"/>
/// <reference path="../built/pxtlib.d.ts"/>
namespace pxtwinrt {
    export function deployCoreAsync(res: ts.pxt.CompileResult) : Promise<void> {
        
        let drives = pxt.appTarget.compile.deployDrives;
        pxt.Util.assert(!!drives);
        console.log(`deploying to drives ${drives}`)

        let drx = new RegExp(drives);
        let r = res.outfiles["microbit.hex"];        
        
        function writeAsync(folder : Windows.Storage.StorageFolder) : Promise<void> {
            console.log(`writing .hex to ${folder.displayName}`)
            return pxtwinrt.promisify(
                    folder.createFileAsync("firmware.hex", Windows.Storage.CreationCollisionOption.replaceExisting)
                    .then(file => Windows.Storage.FileIO.writeTextAsync(file, r))
                    ).then(r => {}).catch(e => {
                        console.log(`failed to write to ${folder.displayName} - ${e}`)
                    })
        }
        
        return pxtwinrt.promisify(Windows.Storage.KnownFolders.removableDevices.getFoldersAsync())
            .then(ds => {
                let df = ds.filter(d => drx.test(d.displayName));
                let pdf = df.map(writeAsync);
                let all = Promise.join(...pdf)
                return all;
            }).then(r => {});
    }
    
    export function browserDownloadAsync(text: string, name: string, contentType: string) : Promise<void> {
        
        let buf = pxt.Util.stringToUint8Array(pxt.Util.toUTF8(text))
        let uri = "data:" + contentType + ";base64," + btoa(pxt.Util.uint8ArrayToString(buf))
        
        return pxtwinrt.promisify<void>(Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(uri), <any>{
                contentType: contentType,
                desiredRemainingView: (Windows.UI.ViewManagement as any).ViewSizePreference.useHalf,
                ui: false
            }).then(b => {}));
    }
}