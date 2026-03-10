import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-api', () => {
    it('should exit 1 when no path is provided', async () => {
        const result = await runBin('short-api');
        expect(result.exitCode).toBe(1);
    });

    it('should show help examples with --help', async () => {
        const result = await runBin('short-api', ['--help']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": 0,
            "stderr": "",
            "stdout": "
          Examples:
            $ short api /search/iterations -f page_size=10 -f query=123
            $ short api /stories -X POST -f 'name=My new story' -f project_id=123
            # jq can be used to shorten the response output.
            $ short api /search/iterations -f page_size=10 -f query=123 | jq '.data[] | {id, name}'",
          }
        `);
    });

    it('should GET /members', async () => {
        const result = await runBin('short-api', ['/members']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "[
            {
              "role": "string",
              "entity_type": "string",
              "disabled": true,
              "global_id": "string",
              "state": "partial",
              "updated_at": "2019-08-24T14:15:22Z",
              "created_without_invite": true,
              "group_ids": [
                "497f6eca-6276-4993-bfeb-53cbbbba6f08"
              ],
              "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
              "installation_id": "91166175-c6a9-4caf-88e9-3147ffc9c934",
              "profile": {
                "entity_type": "string",
                "deactivated": true,
                "two_factor_auth_activated": true,
                "mention_name": "string",
                "name": "string",
                "is_agent": true,
                "gravatar_hash": "string",
                "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
                "display_icon": {
                  "entity_type": "string",
                  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
                  "created_at": "2019-08-24T14:15:22Z",
                  "updated_at": "2019-08-24T14:15:22Z",
                  "url": "string"
                },
                "is_owner": true,
                "email_address": "string"
              },
              "created_at": "2019-08-24T14:15:22Z",
              "replaced_by": "0b11f089-722d-4ced-9beb-e2eeed3637dc"
            }
          ]",
          }
        `);
    });

    it('should handle path without leading slash', async () => {
        const result = await runBin('short-api', ['members']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "[
            {
              "role": "string",
              "entity_type": "string",
              "disabled": true,
              "global_id": "string",
              "state": "partial",
              "updated_at": "2019-08-24T14:15:22Z",
              "created_without_invite": true,
              "group_ids": [
                "497f6eca-6276-4993-bfeb-53cbbbba6f08"
              ],
              "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
              "installation_id": "91166175-c6a9-4caf-88e9-3147ffc9c934",
              "profile": {
                "entity_type": "string",
                "deactivated": true,
                "two_factor_auth_activated": true,
                "mention_name": "string",
                "name": "string",
                "is_agent": true,
                "gravatar_hash": "string",
                "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
                "display_icon": {
                  "entity_type": "string",
                  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
                  "created_at": "2019-08-24T14:15:22Z",
                  "updated_at": "2019-08-24T14:15:22Z",
                  "url": "string"
                },
                "is_owner": true,
                "email_address": "string"
              },
              "created_at": "2019-08-24T14:15:22Z",
              "replaced_by": "0b11f089-722d-4ced-9beb-e2eeed3637dc"
            }
          ]",
          }
        `);
    });

    it('should pass headers with -H (same output as plain GET)', async () => {
        const result = await runBin('short-api', ['/members', '-H', 'X-Test: value']);
        expect(result.exitCode).toBeUndefined();
        expect(result.stdout).toBeTruthy();
    });

    it('should POST with --method POST and -f key=value', async () => {
        const result = await runBin('short-api', [
            '/stories',
            '--method',
            'POST',
            '-f',
            'name=Test Story',
            '-f',
            'project_id=123',
        ]);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "{
            "app_url": "string",
            "description": "string",
            "archived": true,
            "started": true,
            "story_links": [
              {
                "entity_type": "string",
                "object_id": 1,
                "verb": "string",
                "type": "string",
                "updated_at": "2019-08-24T14:15:22Z",
                "id": 1,
                "subject_id": 1,
                "subject_workflow_state_id": 1,
                "created_at": "2019-08-24T14:15:22Z"
              }
            ],
            "entity_type": "string",
            "labels": [
              {
                "app_url": "string",
                "description": "string",
                "archived": true,
                "entity_type": "string",
                "color": "string",
                "name": "string",
                "global_id": "string",
                "updated_at": "2019-08-24T14:15:22Z",
                "external_id": "string",
                "id": 1,
                "created_at": "2019-08-24T14:15:22Z"
              }
            ],
            "mention_ids": [
              "497f6eca-6276-4993-bfeb-53cbbbba6f08"
            ],
            "synced_item": {
              "external_id": "string",
              "url": "string"
            },
            "member_mention_ids": [
              "497f6eca-6276-4993-bfeb-53cbbbba6f08"
            ],
            "story_type": "string",
            "custom_fields": [
              {
                "field_id": "e68e30b1-d177-4632-b748-463bcd0eedc6",
                "value_id": "f0364b24-eaa7-4868-8878-708511209642",
                "value": "string"
              }
            ],
            "linked_files": [
              {
                "description": "string",
                "entity_type": "string",
                "story_ids": [
                  1
                ],
                "mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "member_mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "name": "string",
                "thumbnail_url": "string",
                "type": "string",
                "size": 0,
                "uploader_id": "f6d71539-f0e2-4976-b612-d78d917074bc",
                "content_type": "string",
                "updated_at": "2019-08-24T14:15:22Z",
                "group_mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "id": 1,
                "url": "string",
                "created_at": "2019-08-24T14:15:22Z"
              }
            ],
            "workflow_id": 1,
            "completed_at_override": "2019-08-24T14:15:22Z",
            "started_at": "2019-08-24T14:15:22Z",
            "completed_at": "2019-08-24T14:15:22Z",
            "name": "string",
            "global_id": "string",
            "completed": true,
            "comments": [
              {
                "app_url": "string",
                "entity_type": "string",
                "deleted": true,
                "story_id": 1,
                "mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "author_id": "78424c75-5c41-4b25-9735-3c9f7d05c59e",
                "member_mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "blocker": true,
                "linked_to_slack": true,
                "updated_at": "2019-08-24T14:15:22Z",
                "group_mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "external_id": "string",
                "parent_id": 1,
                "id": 1,
                "position": 0,
                "unblocks_parent": true,
                "reactions": [
                  {
                    "emoji": "string",
                    "permission_ids": [
                      "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                    ]
                  }
                ],
                "created_at": "2019-08-24T14:15:22Z",
                "text": "string"
              }
            ],
            "blocker": true,
            "branches": [
              {
                "entity_type": "string",
                "deleted": true,
                "name": "string",
                "persistent": true,
                "updated_at": "2019-08-24T14:15:22Z",
                "pull_requests": [
                  {
                    "entity_type": "string",
                    "closed": true,
                    "merged": true,
                    "num_added": 0,
                    "branch_id": 1,
                    "overlapping_stories": [
                      1
                    ],
                    "number": 1,
                    "branch_name": "string",
                    "target_branch_name": "string",
                    "num_commits": 0,
                    "title": "string",
                    "updated_at": "2019-08-24T14:15:22Z",
                    "has_overlapping_stories": true,
                    "draft": true,
                    "id": 1,
                    "vcs_labels": [
                      {
                        "entity_type": "string",
                        "id": 1,
                        "color": "string",
                        "description": "string",
                        "name": "string"
                      }
                    ],
                    "url": "string",
                    "num_removed": 0,
                    "review_status": "string",
                    "num_modified": 0,
                    "build_status": "string",
                    "target_branch_id": 1,
                    "repository_id": 1,
                    "created_at": "2019-08-24T14:15:22Z"
                  }
                ],
                "merged_branch_ids": [
                  1
                ],
                "id": 1,
                "url": "string",
                "repository_id": 1,
                "created_at": "2019-08-24T14:15:22Z"
              }
            ],
            "epic_id": 1,
            "story_template_id": "ec7c5fe2-3d1a-4419-a601-e2a008edc7a2",
            "external_links": [
              "string"
            ],
            "previous_iteration_ids": [
              1
            ],
            "requested_by_id": "e5a2565f-0ccc-4e3e-ace9-5e0c44253010",
            "iteration_id": 1,
            "sub_task_story_ids": [
              1
            ],
            "tasks": [
              {
                "description": "string",
                "entity_type": "string",
                "story_id": 1,
                "mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "member_mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "completed_at": "2019-08-24T14:15:22Z",
                "global_id": "string",
                "updated_at": "2019-08-24T14:15:22Z",
                "group_mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "owner_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "external_id": "string",
                "id": 1,
                "position": 0,
                "complete": true,
                "created_at": "2019-08-24T14:15:22Z"
              }
            ],
            "formatted_vcs_branch_name": "string",
            "label_ids": [
              1
            ],
            "started_at_override": "2019-08-24T14:15:22Z",
            "group_id": "306db4e0-7449-4501-b76f-075576fe2d8f",
            "workflow_state_id": 1,
            "updated_at": "2019-08-24T14:15:22Z",
            "pull_requests": [
              {
                "entity_type": "string",
                "closed": true,
                "merged": true,
                "num_added": 0,
                "branch_id": 1,
                "overlapping_stories": [
                  1
                ],
                "number": 1,
                "branch_name": "string",
                "target_branch_name": "string",
                "num_commits": 0,
                "title": "string",
                "updated_at": "2019-08-24T14:15:22Z",
                "has_overlapping_stories": true,
                "draft": true,
                "id": 1,
                "vcs_labels": [
                  {
                    "entity_type": "string",
                    "id": 1,
                    "color": "string",
                    "description": "string",
                    "name": "string"
                  }
                ],
                "url": "string",
                "num_removed": 0,
                "review_status": "string",
                "num_modified": 0,
                "build_status": "string",
                "target_branch_id": 1,
                "repository_id": 1,
                "created_at": "2019-08-24T14:15:22Z"
              }
            ],
            "group_mention_ids": [
              "497f6eca-6276-4993-bfeb-53cbbbba6f08"
            ],
            "follower_ids": [
              "497f6eca-6276-4993-bfeb-53cbbbba6f08"
            ],
            "owner_ids": [
              "497f6eca-6276-4993-bfeb-53cbbbba6f08"
            ],
            "external_id": "string",
            "id": 1,
            "lead_time": 0,
            "parent_story_id": 1,
            "estimate": 0,
            "commits": [
              {
                "entity_type": "string",
                "author_id": "78424c75-5c41-4b25-9735-3c9f7d05c59e",
                "hash": "string",
                "updated_at": "2019-08-24T14:15:22Z",
                "id": 1,
                "url": "string",
                "author_email": "string",
                "timestamp": "2019-08-24T14:15:22Z",
                "author_identity": {
                  "entity_type": "string",
                  "name": "string",
                  "type": "slack"
                },
                "repository_id": 1,
                "created_at": "2019-08-24T14:15:22Z",
                "message": "string"
              }
            ],
            "files": [
              {
                "description": "string",
                "entity_type": "string",
                "story_ids": [
                  1
                ],
                "mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "member_mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "name": "string",
                "thumbnail_url": "string",
                "size": 0,
                "uploader_id": "f6d71539-f0e2-4976-b612-d78d917074bc",
                "content_type": "string",
                "updated_at": "2019-08-24T14:15:22Z",
                "filename": "string",
                "group_mention_ids": [
                  "497f6eca-6276-4993-bfeb-53cbbbba6f08"
                ],
                "external_id": "string",
                "id": 1,
                "url": "string",
                "created_at": "2019-08-24T14:15:22Z"
              }
            ],
            "position": 0,
            "blocked": true,
            "project_id": 1,
            "deadline": "2019-08-24T14:15:22Z",
            "stats": {
              "num_related_documents": 0
            },
            "cycle_time": 0,
            "created_at": "2019-08-24T14:15:22Z",
            "moved_at": "2019-08-24T14:15:22Z"
          }",
          }
        `);
    });

    it('should PUT with --method PUT and -f key=value', async () => {
        const result = await runBin('short-api', [
            '/stories/123',
            '--method',
            'PUT',
            '-f',
            'name=Updated Story',
        ]);
        expect(result.exitCode).toBeUndefined();
        expect(result.stdout).toBeTruthy();
    });

    it('should DELETE with --method DELETE', async () => {
        const result = await runBin('short-api', ['/stories/123', '--method', 'DELETE']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": """",
          }
        `);
    });

    it('should handle API error for nonexistent endpoint', async () => {
        const result = await runBin('short-api', ['/nonexistent/endpoint/that/will/fail']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": 1,
            "stderr": "Error calling API: {
            "type": "https://stoplight.io/prism/errors#NO_PATH_MATCHED_ERROR",
            "title": "Route not resolved, no path matched",
            "status": 404,
            "detail": "The route /api/v3/nonexistent/endpoint/that/will/fail hasn't been found in the specification file"
          }",
            "stdout": "",
          }
        `);
    });

    it('should handle PATCH method error (not supported)', async () => {
        const result = await runBin('short-api', [
            '/stories/123',
            '--method',
            'PATCH',
            '-f',
            'name=Patched',
        ]);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": 1,
            "stderr": "Error calling API: {
            "type": "https://stoplight.io/prism/errors#NO_METHOD_MATCHED_ERROR",
            "title": "Route resolved, but no method matched",
            "status": 405,
            "detail": "The route /api/v3/stories/123 has been matched, but it does not have \\"patch\\" method defined"
          }",
            "stdout": "",
          }
        `);
    });
});
