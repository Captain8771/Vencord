/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings, Settings } from "@api/settings";
import { Link } from "@components/Link";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { filters, mapMangledModuleLazy } from "@webpack";
import { FluxDispatcher, Forms } from "@webpack/common";

// START yoinked from lastfm.tsx
const assetManager = mapMangledModuleLazy(
    "getAssetImage: size must === [number, number] for Twitch",
    {
        getAsset: filters.byCode("apply("),
    }
);

async function getApplicationAsset(key: string): Promise<string> {
    return (await assetManager.getAsset(Settings.plugins.customRPC.appID, [key, undefined]))[0];
}

interface ActivityAssets {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
}

interface Activity {
    state: string;
    details?: string;
    timestamps?: {
        start?: Number;
        end?: Number;
    };
    assets?: ActivityAssets;
    buttons?: Array<string>;
    name: string;
    application_id: string;
    metadata?: {
        button_urls?: Array<string>;
    };
    type: Number;
    flags: Number;
}
// END

async function setRpc() {
    const activity: Activity = {
        application_id: Settings.plugins.customRPC.appID ?? "0",
        name: Settings.plugins.customRPC.appName ?? "Discord",
        state: Settings.plugins.customRPC.state,
        details: Settings.plugins.customRPC.details,
        type: 0,
        flags: 1 << 0,
    };

    if (Settings.plugins.customRPC.startTime) {
        activity.timestamps = {
            start: Settings.plugins.customRPC.startTime || null,
        };
        if (Settings.plugins.customRPC.endTime) {
            activity.timestamps.end = Settings.plugins.customRPC.endTime;
        }
    }

    if (Settings.plugins.customRPC.buttonOneText) {
        activity.buttons = [
            Settings.plugins.customRPC.buttonOneText,
            Settings.plugins.customRPC.buttonTwoText
        ].filter(Boolean);

        activity.metadata = {
            button_urls: [
                Settings.plugins.customRPC.buttonOneURL,
                Settings.plugins.customRPC.buttonTwoURL
            ].filter(Boolean)
        };
    }

    if (Settings.plugins.customRPC.imageBig) {
        activity.assets = {
            large_image: await getApplicationAsset(Settings.plugins.customRPC.imageBig),
            large_text: Settings.plugins.customRPC.imageBigTooltip
        };
    }

    if (Settings.plugins.customRPC.imageSmall) {
        if (!activity.assets) {
            activity.assets = {};
        }
        activity.assets.small_image = await getApplicationAsset(Settings.plugins.customRPC.imageSmall);
        activity.assets.small_text = Settings.plugins.customRPC.imageSmallTooltip;
    }


    for (const k of Object.keys(activity)) {
        const v = activity[k];
        if (typeof v === "string") {
            if (v.length === 0) {
                delete activity[k];
            }
        } else if (typeof v === null || typeof v === undefined) {
            delete activity[k];
        } else {
            // Assuming it's either an array or an object.
            // Should be safe, considering it's only checking
            // the Activity object, and it doesn't have any other
            // type other than object (array :husk: + object), string, or null/undefined.
            if (v.length === 0) {
                delete activity[k];
            }
        }
    }


    FluxDispatcher.dispatch(
        {
            type: "LOCAL_ACTIVITY_UPDATE",
            activity: activity
        }
    );
}

export default definePlugin({
    name: "customRPC",
    description: "Allows you to set a custom rich presence.",
    authors: [Devs.captain],
    start: function () {
        setRpc();
    },
    settings: definePluginSettings({
        appID: {
            type: OptionType.STRING,
            description: "The ID of the application for the rich presence.",
            onChange: setRpc,
        },
        appName: {
            type: OptionType.STRING,
            description: "The name of the presence.",
            onChange: setRpc,
        },
        details: {
            type: OptionType.STRING,
            description: "Line 1 of rich presence.",
            onChange: setRpc
        },
        state: {
            type: OptionType.STRING,
            description: "Line 2 of rich presence.",
            onChange: setRpc
        },
        startTime: {
            type: OptionType.NUMBER,
            description: "Unix Timestamp for beginning of activity.",
            onChange: setRpc
        },
        endTime: {
            type: OptionType.NUMBER,
            description: "Unix Timestamp for end of activity.",
            onChange: setRpc
        },
        imageBig: {
            type: OptionType.STRING,
            description: "Sets the big image to the specified image.",
            onChange: setRpc
        },
        imageBigTooltip: {
            type: OptionType.STRING,
            description: "Sets the tooltip text for the big image.",
            onChange: setRpc
        },
        imageSmall: {
            type: OptionType.STRING,
            description: "Sets the small image to the specified image.",
            onChange: setRpc
        },
        imageSmallTooltip: {
            type: OptionType.STRING,
            description: "Sets the tooltip text for the small image.",
            onChange: setRpc
        },
        buttonOneText: {
            type: OptionType.STRING,
            description: "The text for the first button",
            onChange: setRpc
        },
        buttonOneURL: {
            type: OptionType.STRING,
            description: "The URL for the first button",
            onChange: setRpc
        },
        buttonTwoText: {
            type: OptionType.STRING,
            description: "The text for the second button",
            onChange: setRpc
        },
        buttonTwoURL: {
            type: OptionType.STRING,
            description: "The URL for the second button",
            onChange: setRpc
        }
    }),
    settingsAboutComponent: () => (
        <>
            <Forms.FormTitle tag="h1">NOTE:</Forms.FormTitle>
            <Forms.FormText>
                You will need to <Link href="https://discord.com/developers/applications">create an application</Link> and
                get its ID to use this plugin.
            </Forms.FormText>
        </>
    )
});