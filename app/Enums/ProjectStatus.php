<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Planning = 'Planning';
    case InProgress = 'In Progress';
    case OnHold = 'On Hold';
    case Completed = 'Completed';
}
