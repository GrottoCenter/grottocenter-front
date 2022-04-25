/**
 * When creating or updating an entrance, there are 2 possibilities :
 *    - ENTRANCE_ONLY = The new entrance is attached to an existing network.
 *                      User doesn't create a cave.
 *                      User can't update the network data.
 *    - ENTRANCE_AND_CAVE = The new entrance is the first one of a new cave on Grottocenter.
 *                          User is creating a couple cave / entrance in this case.
 *                          User can't update cave data.
 *
 * In both cases, the user must go to the cave or network page to update it.
 */

export const ENTRANCE_ONLY = 'ENTRANCE_ONLY';
export const ENTRANCE_AND_CAVE = 'ENTRANCE_AND_CAVE';
