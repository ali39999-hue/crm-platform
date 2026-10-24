import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { SearchService } from './search.service.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import type { SearchResultDto } from '@crm/contracts';

@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser() user: UserContext,
    @Query() query: SearchQueryDto,
  ): Promise<SearchResultDto> {
    const rawTypes = query.types ?? query.entityTypes;
    let parsedTypes: string[] | undefined;

    if (typeof rawTypes === 'string') {
      parsedTypes = rawTypes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(rawTypes)) {
      parsedTypes = rawTypes.map((s) => String(s).trim()).filter(Boolean);
    }

    return this.searchService.search(
      user.activeOrganization.id,
      user.activeOrganization.role,
      user.id,
      query.q ?? '',
      parsedTypes,
      query.limit,
    );
  }
}
