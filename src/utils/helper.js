/**
 * Created by igor on 27.06.16.
 */

const log = require(__appRoot + '/lib/log')(module);


module.exports.getDomainFromSwitchEvent = (data) => {
    if (!data)
        return null;

    if (data.variable_domain_name)
        return data.variable_domain_name;

    if (data.variable_w_domain)
        return data.variable_w_domain;

    if (data['Channel-Presence-ID'])
        return data['Channel-Presence-ID'].substring(data['Channel-Presence-ID'].indexOf('@') + 1);
    
    if (data['Channel-Presence-Data'])
        return data['Channel-Presence-Data'].substring(data['Channel-Presence-Data'].indexOf('@') + 1);

    if (data['variable_presence_id'])
        return data['variable_presence_id'].substring(data['variable_presence_id'].indexOf('@') + 1);
};

module.exports.encodeRK = (rk) => {
    try {
        if (rk)
            return encodeURIComponent(rk)
                .replace(/\./g, '%2E')
                .replace(/\:/g, '%3A')
    } catch(e) {
        log.error(e);
        return null;
    }
};