<?php

use Facebook\WebDriver\WebDriverBy;
use Laravel\Dusk\Browser;

/**
 * Selects a Radix UI option (our shadcn Select primitive doesn't render a
 * native <select>, so Dusk's built-in ->select() can't target it — the
 * trigger must already be open before calling this).
 */
function selectRadixOption(Browser $browser, string $label): void
{
    $browser->driver
        ->findElement(WebDriverBy::xpath("//div[@role='option'][contains(., '{$label}')]"))
        ->click();
}

/**
 * Presses a button (by its text) inside the table row containing $rowText.
 * Dusk's ->with()/->click() only resolve CSS selectors, so scoping by row
 * content needs the underlying WebDriver's XPath support directly.
 */
function pressButtonInRow(Browser $browser, string $rowText, string $buttonText): void
{
    $row = $browser->driver->findElement(WebDriverBy::xpath("//tr[contains(., '{$rowText}')]"));
    $row->findElement(WebDriverBy::xpath(".//button[contains(text(), '{$buttonText}')]"))->click();
}

/**
 * Presses a button inside the currently-open Radix dialog specifically.
 * Needed because the row's own "Delete" button has identical text to the
 * confirm dialog's button and remains present (just visually behind the
 * overlay) while the dialog is open, so Dusk's plain ->press() is ambiguous
 * and may resolve to the wrong one.
 */
function pressButtonInDialog(Browser $browser, string $buttonText): void
{
    $dialog = $browser->driver->findElement(WebDriverBy::xpath("//div[@role='dialog']"));
    $dialog->findElement(WebDriverBy::xpath(".//button[contains(text(), '{$buttonText}')]"))->click();
}

/**
 * Sets a native <input type="date">'s value directly via JS instead of
 * Dusk's ->type(), which sends keys into the input's segmented day/month/year
 * sub-fields one character at a time — including the literal "-" separators
 * — and reliably garbles the result (a well-known WebDriver limitation).
 *
 * A plain `input.value = ...` wouldn't be picked up by React's onChange: React
 * tracks each input's last known value internally, so setting `.value`
 * directly (bypassing React) leaves that tracker stale and React's change
 * detection ignores the follow-up "input" event as a no-op. Calling the
 * native HTMLInputElement value setter first (via its prototype, so it
 * doesn't go through any React-patched accessor) avoids that entirely.
 */
function setDateInput(Browser $browser, string $selector, string $value): void
{
    $browser->script(<<<JS
        (function () {
            const input = document.querySelector('{$selector}');
            const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setValue.call(input, '{$value}');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        })();
        JS);
}

test('full project crud flow via a real browser', function () {
    $suffix = uniqid();
    $clientName = "Dusk QA Co {$suffix}";
    $projectName = "Dusk Smoke Test {$suffix}";
    $editedProjectName = "Dusk Smoke Test {$suffix} (Edited)";

    $this->browse(function (Browser $browser) use ($suffix, $clientName, $projectName, $editedProjectName) {
        $browser->visit('/projects')
            ->waitForText('Client Project Tracker')
            ->waitFor('table');

        // Create
        $browser->press('+ New Project')
            ->waitForText('New Project')
            ->type('#client_name', $clientName)
            ->type('#project_name', $projectName)
            ->click('#status')
            ->waitForText('Planning');
        selectRadixOption($browser, 'Planning');
        $browser->pause(300) // let the Radix Select close/exit-animate before the next interaction
            ->click('#priority')
            ->waitForText('Low');
        selectRadixOption($browser, 'Low');
        $browser->pause(300);
        setDateInput($browser, '#start_date', '2026-05-01');
        setDateInput($browser, '#due_date', '2026-06-01');
        $browser->press('Create Project')
            ->waitForText($projectName)
            ->assertSee($clientName)
            ->assertSee($projectName);

        // The row renders with a disabled "Saving…" state until the optimistic
        // create's real round-trip reconciles its temporary id — wait it out.
        $browser->waitUntilMissingText('Saving…');

        // The seeded data plus this new row can span more than one page, and
        // the newly-created row isn't guaranteed to land on page 1 once the
        // list re-sorts by its real, server-assigned creation time. Search by
        // the unique suffix so the row stays reachable regardless of paging —
        // this also exercises the search feature itself, sourced from filters.
        $browser->type('input[aria-label="Search projects"]', $suffix)
            ->pause(500)
            ->waitForText($projectName);

        // Edit
        pressButtonInRow($browser, $projectName, 'Edit');

        $browser->waitForText('Edit Project')
            ->clear('#project_name')
            ->type('#project_name', $editedProjectName)
            ->press('Save Changes')
            ->waitForText($editedProjectName)
            ->assertSee($editedProjectName);

        // Make sure the edit dialog (and its overlay) has fully closed before
        // interacting with the table again — its exit animation can otherwise
        // still be intercepting clicks for a moment after the text updates.
        $browser->waitUntilMissingText('Edit Project')
            ->pause(300);

        // Delete
        pressButtonInRow($browser, $editedProjectName, 'Delete');

        $browser->waitForText('Delete Project');
        pressButtonInDialog($browser, 'Delete');
        $browser->waitUntilMissingText($editedProjectName)
            ->assertDontSee($editedProjectName);
    });
});
