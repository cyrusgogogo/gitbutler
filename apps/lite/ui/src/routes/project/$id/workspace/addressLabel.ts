import { message, type LocalizedText } from "@gitbutler/i18n";
import type { HeadInfoIndex } from "#ui/api/ref-info.ts";
import { commitTitle, shortCommitId } from "#ui/commit.ts";
import { Match } from "effect";
import type { Address } from "#ui/addresses.ts";
import { assert } from "#ui/assert.ts";

/** What a set of hunk lines amounts to: "+3 -1 lines", the words a drag of them carries. */
const hunkAddressesLabel = (
	addresses: Array<Extract<Address, { _tag: "Hunk" }>>,
): LocalizedText => {
	const add = addresses.reduce(
		(sum, address) =>
			sum +
			address.lineGroups.reduce(
				(groupSum, group) => groupSum + (group.side === "additions" ? group.lines : 0),
				0,
			),
		0,
	);
	const del = addresses.reduce(
		(sum, address) =>
			sum +
			address.lineGroups.reduce(
				(groupSum, group) => groupSum + (group.side === "deletions" ? group.lines : 0),
				0,
			),
		0,
	);
	const all = add + del;

	// Probably shouldn't happen?
	if (all == 0) return message("lite:address.noLines");

	let words = "";
	if (add > 0) words += `+${add}`;
	if (add > 0 && del > 0) words += ` `;
	if (del > 0) words += `-${del}`;
	return message("lite:address.lines", { count: all, changes: words });
};

export const addressLabel = ({
	address,
	headInfoIndex,
}: {
	address: Address;
	headInfoIndex: HeadInfoIndex;
}): LocalizedText =>
	Match.value(address).pipe(
		Match.tagsExhaustive({
			Branch: ({ branchRef }) => {
				const segment = headInfoIndex.branchContextByRefBytes(branchRef)?.segment;
				return assert(segment?.refName).displayName;
			},
			File: ({ path }) => path,
			UncommittedChanges: () => message("lite:address.uncommitted"),
			Commit: ({ commitId }) => {
				const commit = headInfoIndex.commitContextByCommitId(commitId)?.commit;
				return commit
					? message("lite:address.commit", {
							title: commitTitle(commit.message) ?? message("lite:address.noMessage"),
							conflict: commit.hasConflicts ? " ⚠️" : "",
						})
					: shortCommitId(commitId);
			},
			Hunk: (address) => hunkAddressesLabel([address]),
		}),
	);

export const addressesLabel = ({
	addresses,
	headInfoIndex,
}: {
	addresses: Array<Address>;
	headInfoIndex: HeadInfoIndex;
}): LocalizedText => {
	if (addresses.length > 0 && addresses.every((address) => address._tag === "Hunk"))
		return hunkAddressesLabel(addresses);
	if (addresses.length !== 1) return message("lite:address.items", { count: addresses.length });

	return addressLabel({ address: assert(addresses[0]), headInfoIndex });
};
