/*
 * Copyright 2026 Element Creations Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import { render } from "@test-utils";
import { describe, it, expect, vitest } from "vitest";
import React from "react";
import { composeStories } from "@storybook/react-vite";
import userEvent from "@testing-library/user-event";

import * as stories from "./LinkedText.stories.tsx";
import { LinkedText } from "./LinkedText.tsx";
import { LinkifyOptionalSlashProtocols, PERMITTED_URL_SCHEMES } from "../linkify";
import { LinkedTextContext } from "./LinkedTextContext.tsx";

const { Default, WithUserId, WithRoomAlias, WithCustomHref, WithCustomUrlTarget } = composeStories(stories);

describe("LinkedText", () => {
    it.each(
        PERMITTED_URL_SCHEMES.filter((protocol) => !LinkifyOptionalSlashProtocols.includes(protocol)).map(
            (protocol) => `${protocol}://abcdef/`,
        ),
    )("renders protocol with no optional slash '%s'", (path) => {
        const { getByRole } = render(
            <LinkedTextContext value={{}}>
                <LinkedText>Check out this link {path}</LinkedText>
            </LinkedTextContext>,
        );
        expect(getByRole("link")).toBeInTheDocument();
    });

    it.each(LinkifyOptionalSlashProtocols.map((protocol) => `${protocol}://abcdef`))(
        "renders protocol with optional slash '%s'",
        (path) => {
            const { getByRole } = render(
                <LinkedTextContext value={{}}>
                    <LinkedText>Check out this link {path}</LinkedText>
                </LinkedTextContext>,
            );
            expect(getByRole("link")).toBeInTheDocument();
        },
    );

    it("renders a standard link", () => {
        const { container } = render(<Default />);
        expect(container).toMatchSnapshot();
    });

    it("linkifies domains without a protocol.", () => {
        // PATCH-RENAISSANCE-E — les bare domains avec TLD valide (ex : `parti.re`, `github.com`)
        // doivent être linkifiés et préfixés par le `defaultProtocol` `https`.
        const { queryAllByRole } = render(
            <LinkedTextContext value={{}}>
                <LinkedText>Check out this link github.com</LinkedText>
            </LinkedTextContext>,
        );
        const links = queryAllByRole("link");
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveAttribute("href", "https://github.com");
    });

    it("does not linkify bare IP addresses.", () => {
        // Safety : `linkifyjs` ne matche pas les bare IP dans son scanner par défaut.
        // On garde une assertion explicite pour éviter une régression si l'upstream change.
        const { queryAllByRole } = render(
            <LinkedTextContext value={{}}>
                <LinkedText>Check out this address 192.168.1.1 or 8.8.8.8</LinkedText>
            </LinkedTextContext>,
        );
        expect(queryAllByRole("link")).toHaveLength(0);
    });

    it("renders a user ID", () => {
        const { container } = render(<WithUserId />);
        expect(container).toMatchSnapshot();
    });

    it("renders a room alias", () => {
        const { container } = render(<WithRoomAlias />);
        expect(container).toMatchSnapshot();
    });

    it("renders a custom target", () => {
        const { container } = render(<WithCustomUrlTarget />);
        expect(container).toMatchSnapshot();
    });

    it("renders a custom href", () => {
        const { container } = render(<WithCustomHref />);
        expect(container).toMatchSnapshot();
    });

    it("supports setting an onLinkClicked handler", async () => {
        const fn = vitest.fn();
        const { getAllByRole } = render(
            <LinkedTextContext value={{}}>
                <LinkedText onLinkClick={fn}>Check out this link https://google.com and https://example.org</LinkedText>
            </LinkedTextContext>,
        );
        const links = getAllByRole("link");
        expect(links).toHaveLength(2);
        await userEvent.click(links[0]);
        await userEvent.click(links[1]);
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
