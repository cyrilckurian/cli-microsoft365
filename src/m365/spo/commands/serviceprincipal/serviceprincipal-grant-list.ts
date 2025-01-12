import { Logger } from '../../../../cli';
import config from '../../../../config';
import request from '../../../../request';
import { spo, ClientSvcResponse, ClientSvcResponseContents } from '../../../../utils';
import SpoCommand from '../../../base/SpoCommand';
import commands from '../../commands';
import { SPOWebAppServicePrincipalPermissionGrant } from './SPOWebAppServicePrincipalPermissionGrant';

class SpoServicePrincipalGrantListCommand extends SpoCommand {
  public get name(): string {
    return commands.SERVICEPRINCIPAL_GRANT_LIST;
  }

  public get description(): string {
    return 'Lists permissions granted to the service principal';
  }

  public alias(): string[] | undefined {
    return [commands.SP_GRANT_LIST];
  }

  public async commandAction(logger: Logger): Promise<void> {
    try {
      const spoAdminUrl = await spo.getSpoAdminUrl(logger, this.debug);

      if (this.verbose) {
        logger.logToStderr(`Retrieving request digest...`);
      }

      const reqDigest = await spo.getRequestDigest(spoAdminUrl);

      const requestOptions: any = {
        url: `${spoAdminUrl}/_vti_bin/client.svc/ProcessQuery`,
        headers: {
          'X-RequestDigest': reqDigest.FormDigestValue
        },
        data: `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectPath Id="6" ObjectPathId="5" /><Query Id="7" ObjectPathId="5"><Query SelectAllProperties="true"><Properties /></Query><ChildItemQuery SelectAllProperties="true"><Properties /></ChildItemQuery></Query></Actions><ObjectPaths><Constructor Id="3" TypeId="{104e8f06-1e00-4675-99c6-1b9b504ed8d8}" /><Property Id="5" ParentId="3" Name="PermissionGrants" /></ObjectPaths></Request>`
      };

      const res = await request.post<string>(requestOptions);

      const json: ClientSvcResponse = JSON.parse(res);
      const response: ClientSvcResponseContents = json[0];
      if (response.ErrorInfo) {
        throw response.ErrorInfo.ErrorMessage;
      }
      else {
        const result: SPOWebAppServicePrincipalPermissionGrant[] = json[json.length - 1]._Child_Items_;
        logger.log(result.map(r => {
          delete r._ObjectType_;
          delete r.ClientId;
          delete r.ConsentType;
          return r;
        }));
      }
    }
    catch (err: any) {
      this.handleRejectedPromise(err);
    }
  }
}

module.exports = new SpoServicePrincipalGrantListCommand();