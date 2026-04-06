FROM node:22-slim

# Install git and claude CLI dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Create app user (Claude refuses --dangerously-skip-permissions as root)
RUN useradd -m -s /bin/bash agent
USER agent
WORKDIR /home/agent

# Clone or mount the repo — default to clone
ARG REPO_URL=https://github.com/sethshoultes/great-minds.git
RUN git clone ${REPO_URL} /home/agent/great-minds || true

# Install daemon dependencies
WORKDIR /home/agent/great-minds/daemon
COPY --chown=agent:agent package.json package-lock.json* ./
RUN npm install

# Copy daemon source
COPY --chown=agent:agent . .

# Install memory store
WORKDIR /home/agent/great-minds/memory-store
RUN npm install 2>/dev/null || true

WORKDIR /home/agent/great-minds/daemon

# Health check — verify daemon process is alive
HEALTHCHECK --interval=60s --timeout=10s --retries=3 \
    CMD pgrep -f "daemon.ts" || exit 1

# Logs go to stdout + /tmp/claude-shared/daemon.log
ENV NODE_ENV=production
ENV PIPELINE_REPO=/home/agent/great-minds

CMD ["npx", "tsx", "src/daemon.ts"]
