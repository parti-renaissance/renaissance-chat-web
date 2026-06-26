/*
Copyright 2026 Element Creations Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { useEffect } from "react";
import { Button, Heading, Text } from "@vector-im/compound-web";

import { _t } from "../../../languageHandler";
import SdkConfig from "../../../SdkConfig.ts";
import { MatrixClientPeg } from "../../../MatrixClientPeg.ts";
import { isElementBranded } from "../../../branding.ts";

const DefaultWelcome: React.FC = () => {
    const brand = SdkConfig.get("brand");
    const branding = SdkConfig.getObject("branding");
    const logoUrl = branding.get("auth_header_logo_url");

    const showGuestFunctions = !!MatrixClientPeg.get();
    const isElement = isElementBranded();

    // PATCH-RENAISSANCE-B v2.3 : auto-redirect vers la step /#/login dès que la Welcome page
    // monte sans session active. Combiné avec l'auto-trigger OIDC dans Login.tsx, le user
    // non-connecté arrive directement sur la page MAS sans le moindre clic intermédiaire.
    // showGuestFunctions === true = un MatrixClient existe déjà (guest ou session valide),
    // on garde la Welcome page traditionnelle dans ce cas.
    useEffect(() => {
        if (!showGuestFunctions) {
            window.location.hash = "#/login";
        }
    }, [showGuestFunctions]);

    return (
        <div className="mx_DefaultWelcome">
            <a href={branding.get("logo_link_url")} target="_blank" rel="noopener" className="mx_DefaultWelcome_logo">
                <img src={logoUrl} alt={brand} />
            </a>
            <Heading as="h1" weight="semibold">
                {isElement ? _t("welcome|title_element") : _t("welcome|title_generic", { brand })}
            </Heading>
            {isElement && <Text size="md">{_t("welcome|tagline_element")}</Text>}

            <div className="mx_DefaultWelcome_buttons">
                <Button as="a" href="#/login" kind="primary" size="md">
                    {_t("action|sign_in")}
                </Button>
                {/* PATCH-RENAISSANCE-B v2.2 : CTA "Create account" retiré (inscription token-only via /onboard/, ADR 0015) */}
                {showGuestFunctions && (
                    <Button as="a" href="#/directory" kind="tertiary" size="md">
                        {_t("action|explore_rooms")}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default DefaultWelcome;
