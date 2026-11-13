// GERADO por scripts/gen-crm-contract.mjs a partir do openapi.json do CRM. Não edite à mão.
// openapi 1.1.0
export const CRM_CONTRACT = {
 "CreateLead": {
  "type": "object",
  "additionalProperties": false,
  "required": [
   "name",
   "lead_type",
   "phone",
   "origin"
  ],
  "properties": {
   "name": {
    "type": "string",
    "minLength": 2,
    "maxLength": 200
   },
   "lead_type": {
    "type": "string",
    "enum": [
     "psicologo_individual",
     "clinica",
     "parceiro"
    ]
   },
   "phone": {
    "type": "string",
    "minLength": 8,
    "maxLength": 30
   },
   "email": {
    "type": [
     "string",
     "null"
    ],
    "format": "email"
   },
   "instagram": {
    "type": [
     "string",
     "null"
    ]
   },
   "origin": {
    "type": "string"
   },
   "responsible_id": {
    "type": [
     "string",
     "null"
    ],
    "format": "uuid"
   },
   "classification": {
    "type": "string"
   },
   "observations": {
    "type": [
     "string",
     "null"
    ]
   },
   "next_action": {
    "type": [
     "string",
     "null"
    ]
   },
   "follow_up_date": {
    "type": [
     "string",
     "null"
    ],
    "format": "date"
   },
   "plan_interest": {
    "type": [
     "string",
     "null"
    ],
    "enum": [
     "gratuito",
     "essencial",
     "clinica",
     "nao_definido",
     null
    ]
   },
   "professionals_count": {
    "type": [
     "integer",
     "null"
    ],
    "minimum": 1
   },
   "current_system": {
    "type": [
     "string",
     "null"
    ]
   },
   "main_challenge": {
    "type": [
     "string",
     "null"
    ]
   },
   "decision_timeline": {
    "type": [
     "string",
     "null"
    ],
    "enum": [
     "imediato",
     "ate_30_dias",
     "ate_90_dias",
     "sem_previsao",
     null
    ]
   },
   "is_decision_maker": {
    "type": [
     "boolean",
     "null"
    ]
   }
  }
 },
 "UpdateLead": {
  "type": "object",
  "additionalProperties": false,
  "minProperties": 1,
  "properties": {
   "name": {
    "type": "string",
    "minLength": 2,
    "maxLength": 200
   },
   "lead_type": {
    "type": "string",
    "enum": [
     "psicologo_individual",
     "clinica",
     "parceiro"
    ]
   },
   "phone": {
    "type": "string",
    "minLength": 8,
    "maxLength": 30
   },
   "email": {
    "type": [
     "string",
     "null"
    ],
    "format": "email"
   },
   "instagram": {
    "type": [
     "string",
     "null"
    ]
   },
   "origin": {
    "type": "string",
    "enum": [
     "instagram",
     "whatsapp",
     "landing_page",
     "indicacao",
     "evento",
     "linkedin",
     "facebook_meta",
     "google",
     "parceria",
     "outbound",
     "outro"
    ]
   },
   "responsible_id": {
    "type": [
     "string",
     "null"
    ],
    "format": "uuid"
   },
   "classification": {
    "type": "string",
    "enum": [
     "frio",
     "morno",
     "quente",
     "super_quente"
    ]
   },
   "observations": {
    "type": [
     "string",
     "null"
    ]
   },
   "next_action": {
    "type": [
     "string",
     "null"
    ]
   },
   "follow_up_date": {
    "type": [
     "string",
     "null"
    ],
    "format": "date"
   },
   "plan_interest": {
    "type": [
     "string",
     "null"
    ],
    "enum": [
     "gratuito",
     "essencial",
     "clinica",
     "nao_definido",
     null
    ]
   },
   "professionals_count": {
    "type": [
     "integer",
     "null"
    ],
    "minimum": 1
   },
   "current_system": {
    "type": [
     "string",
     "null"
    ]
   },
   "main_challenge": {
    "type": [
     "string",
     "null"
    ]
   },
   "decision_timeline": {
    "type": [
     "string",
     "null"
    ],
    "enum": [
     "imediato",
     "ate_30_dias",
     "ate_90_dias",
     "sem_previsao",
     null
    ]
   },
   "is_decision_maker": {
    "type": [
     "boolean",
     "null"
    ]
   },
   "test_status": {
    "type": [
     "string",
     "null"
    ],
    "enum": [
     "pending",
     "active",
     "completed",
     "cancelled",
     null
    ]
   },
   "test_start_date": {
    "type": [
     "string",
     "null"
    ],
    "format": "date"
   },
   "test_end_date": {
    "type": [
     "string",
     "null"
    ],
    "format": "date"
   },
   "test_feedback": {
    "type": [
     "string",
     "null"
    ]
   }
  }
 },
 "MoveStage": {
  "type": "object",
  "additionalProperties": false,
  "required": [
   "status"
  ],
  "properties": {
   "status": {
    "type": "string",
    "enum": [
     "novo_lead",
     "contato_feito",
     "reuniao_agendada",
     "reuniao_realizada",
     "em_teste",
     "negociacao",
     "cliente_ativo",
     "perdido",
     "pausado"
    ]
   },
   "loss_reason": {
    "type": "object",
    "required": [
     "reasons",
     "details"
    ],
    "properties": {
     "reasons": {
      "type": "array",
      "minItems": 1,
      "items": {
       "type": "string"
      }
     },
     "details": {
      "type": "string"
     },
     "had_test": {
      "type": "boolean",
      "default": false
     }
    }
   }
  },
  "allOf": [
   {
    "if": {
     "properties": {
      "status": {
       "const": "perdido"
      }
     }
    },
    "then": {
     "required": [
      "loss_reason"
     ],
     "properties": {
      "loss_reason": {}
     }
    }
   }
  ]
 },
 "CreateActivity": {
  "type": "object",
  "additionalProperties": false,
  "required": [
   "lead_id",
   "type",
   "scheduled_date",
   "scheduled_time"
  ],
  "properties": {
   "lead_id": {
    "type": "string",
    "format": "uuid"
   },
   "type": {
    "type": "string",
    "enum": [
     "enviar_mensagem",
     "ligar",
     "agendar_reuniao",
     "followup"
    ]
   },
   "scheduled_date": {
    "type": "string",
    "format": "date"
   },
   "scheduled_time": {
    "type": "string"
   },
   "responsible_id": {
    "type": [
     "string",
     "null"
    ],
    "format": "uuid"
   },
   "observations": {
    "type": [
     "string",
     "null"
    ]
   }
  }
 },
 "UpdateActivity": {
  "type": "object",
  "additionalProperties": false,
  "minProperties": 1,
  "properties": {
   "type": {
    "type": "string"
   },
   "scheduled_date": {
    "type": "string",
    "format": "date"
   },
   "scheduled_time": {
    "type": "string"
   },
   "responsible_id": {
    "type": [
     "string",
     "null"
    ],
    "format": "uuid"
   },
   "status": {
    "type": "string",
    "enum": [
     "pendente",
     "em_andamento",
     "concluida",
     "atrasada"
    ]
   },
   "observations": {
    "type": [
     "string",
     "null"
    ]
   }
  }
 },
 "CreateMeeting": {
  "type": "object",
  "additionalProperties": false,
  "required": [
   "lead_id",
   "title",
   "scheduled_at"
  ],
  "properties": {
   "lead_id": {
    "type": "string",
    "format": "uuid"
   },
   "title": {
    "type": "string"
   },
   "scheduled_at": {
    "type": "string",
    "format": "date-time"
   },
   "notes_before": {
    "type": [
     "string",
     "null"
    ]
   },
   "channel": {
    "type": [
     "string",
     "null"
    ]
   },
   "duration_minutes": {
    "type": "integer",
    "minimum": 1,
    "maximum": 480
   },
   "meeting_link": {
    "type": [
     "string",
     "null"
    ],
    "format": "uri"
   }
  }
 },
 "UpdateMeeting": {
  "type": "object",
  "additionalProperties": false,
  "minProperties": 1,
  "properties": {
   "title": {
    "type": "string"
   },
   "scheduled_at": {
    "type": "string",
    "format": "date-time"
   },
   "status": {
    "type": "string"
   },
   "notes_before": {
    "type": [
     "string",
     "null"
    ]
   },
   "notes_after": {
    "type": [
     "string",
     "null"
    ]
   },
   "transcription": {
    "type": [
     "string",
     "null"
    ]
   },
   "outcome": {
    "type": [
     "string",
     "null"
    ]
   },
   "closing_probability": {
    "type": [
     "integer",
     "null"
    ],
    "minimum": 0,
    "maximum": 100
   },
   "next_step": {
    "type": [
     "string",
     "null"
    ]
   },
   "next_step_due_date": {
    "type": [
     "string",
     "null"
    ],
    "format": "date"
   }
  }
 }
} as const;
export type CrmContractName = keyof typeof CRM_CONTRACT;
