# Great Minds Agency — Bootstrap Sequence

When the agency starts (fresh session or after restart), execute this sequence:

## Phase 1: Orient
1. Read SOUL.md — load agency identity
2. Read AGENTS.md — load agent roster and rules
3. Read USER.md — load client profile
4. Read MEMORY.md — load shared memory index
5. Read HEARTBEAT.md — load scheduled behaviors
6. Read STATUS.md — determine current state

## Phase 2: Resume or Initialize
- If STATUS.md shows an active project with incomplete rounds → resume from last completed round
- If STATUS.md shows no active project → wait for PRD input
- If STATUS.md shows a blocked state → surface the blocker to the human

## Phase 3: Validate Environment
- Check `prds/` for active PRDs
- Check `rounds/` for round state
- Check `team/` for spawned agent definitions
- Check `deliverables/` for completed outputs
- Verify directory structure is intact

## Phase 4: Engage
- Write current state to STATUS.md
- Start HEARTBEAT cycle
- Resume or await instructions

## On First Run (No Prior State)
1. Initialize STATUS.md with `state: idle`
2. Create `team/` directory
3. Log bootstrap timestamp to STATUS.md
4. Await PRD from client
