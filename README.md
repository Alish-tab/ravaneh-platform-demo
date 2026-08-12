# Ravaneh Platform

Ravaneh is a last-mile delivery planning and operations platform.

The product covers three main areas:

- Data Quality
- Planning / Routing
- Delivery Operations

## About

## Repository Structure

apps/
admin/
driver/

backend/

docs/
domain.md
architecture.md
decisions.md

scripts/
infra/

## Requirements

## Clone

git clone git@github.com:ravanehorg/ravaneh-platform.git
cd ravaneh-platform

## Environment Variables

Copy .env.example and create your local .env.

Never commit real secrets.

Admin App

Not initialized yet.

Driver App

Not initialized yet.

Backend

Not initialized yet.

Docker

Not initialized yet.

## Admin App

## Driver App

## Backend

## Docker

## Development Workflow

Update main
Create a small feature branch
Make your changes
Push the branch
Open a Pull Request
Merge into main

Example:

git checkout main
git pull origin main
git checkout -b feat/import-review

## Branch Naming

Examples:

feat/admin-map
feat/import-review
feat/backend-import
feat/driver-route
fix/map-marker
docs/architecture
chore/docker-setup

Branches should stay small and short-lived.

## Pull Requests

Low-risk changes can be self-merged after checking the diff and making sure the project still works.

Critical changes should be reviewed by at least one other team member.

Examples of critical areas:

Database schema / migrations
Excel import
Authentication
Route assignment and editing
Neshan integration
Delivery logic
Deployment
